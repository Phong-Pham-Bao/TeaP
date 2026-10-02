import './assert-test-database';
import {
  IdempotencyStatus,
  OutboxStatus,
  Prisma,
  PrismaClient,
  Role,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { OutboxService } from '../src/modules/platform/outbox.service';

const prisma = new PrismaClient();
const runId = randomUUID();
let branchId: string | undefined;
let userId: string | undefined;

async function main() {
  const branch = await prisma.branch.create({
    data: {
      name: `Platform smoke ${runId}`,
      address: 'Test-only branch',
    },
  });
  branchId = branch.id;
  const user = await prisma.user.create({
    data: {
      email: `platform-${runId}@teap.test`,
      password: 'test-only-password',
      fullName: 'Platform Smoke User',
      role: Role.SUPER_ADMIN,
      branchId: branch.id,
    },
  });
  userId = user.id;

  const created = await prisma.$transaction(async (tx) => {
    const idempotency = await tx.idempotencyRecord.create({
      data: {
        actorId: user.id,
        scopeKey: branch.id,
        action: 'PLATFORM_SMOKE',
        key: `smoke-${runId}`,
        requestHash: 'a'.repeat(64),
        status: IdempotencyStatus.COMPLETED,
        responseStatus: 200,
        responseBody: { ok: true },
        resourceType: 'Smoke',
        resourceId: runId,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const audit = await tx.auditEvent.create({
      data: {
        actorId: user.id,
        branchId: branch.id,
        action: 'PLATFORM.SMOKE',
        resourceType: 'Smoke',
        resourceId: runId,
        correlationId: runId,
      },
    });
    const outbox = await tx.outboxEvent.create({
      data: {
        aggregateType: 'Smoke',
        aggregateId: runId,
        eventType: 'smoke.test',
        payload: { runId },
        correlationId: runId,
      },
    });
    return { idempotency, audit, outbox };
  });

  try {
    await prisma.idempotencyRecord.create({
      data: {
        actorId: user.id,
        scopeKey: branch.id,
        action: 'PLATFORM_SMOKE',
        key: `smoke-${runId}`,
        requestHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    throw new Error('Idempotency unique constraint did not reject a duplicate key');
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
  }

  const outboxService = new OutboxService(prisma as never);
  const claimed = await outboxService.claimBatch(`smoke-worker-${runId}`, 1);
  if (claimed.length !== 1 || claimed[0].id !== created.outbox.id) {
    throw new Error('Outbox SKIP LOCKED claim did not return the expected event');
  }
  await outboxService.markPublished(created.outbox.id, `smoke-worker-${runId}`);
  const published = await prisma.outboxEvent.findUnique({
    where: { id: created.outbox.id },
    select: { status: true },
  });
  if (published?.status !== OutboxStatus.PUBLISHED) {
    throw new Error('Outbox event was not marked published');
  }

  console.log('Platform database smoke test passed');
}

main()
  .finally(async () => {
    if (userId) {
      await prisma.idempotencyRecord.deleteMany({ where: { actorId: userId } });
      await prisma.auditEvent.deleteMany({ where: { actorId: userId } });
    }
    await prisma.outboxEvent.deleteMany({ where: { correlationId: runId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
