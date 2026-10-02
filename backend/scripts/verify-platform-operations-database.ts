import './assert-test-database';
import { ConfigService } from '@nestjs/config';
import {
  IdempotencyStatus,
  OutboxStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthenticatedActor } from '../src/common/types/authenticated-actor';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/modules/platform/audit.service';
import { PlatformOperationsService } from '../src/modules/platform/platform-operations.service';

const prisma = new PrismaClient();
const runId = randomUUID();
const branchId = randomUUID();
const userId = randomUUID();
const oldDate = new Date(Date.now() - 40 * 86_400_000);
const expiredDate = new Date(Date.now() - 2 * 86_400_000);
const futureDate = new Date(Date.now() + 86_400_000);
const prismaService = prisma as unknown as PrismaService;
const operations = new PlatformOperationsService(
  prismaService,
  new AuditService(),
  new ConfigService({
    AUDIT_RETENTION_DAYS: '30',
    OUTBOX_PUBLISHED_RETENTION_DAYS: '30',
    IDEMPOTENCY_RETENTION_GRACE_DAYS: '1',
  }),
);
const actor: AuthenticatedActor = {
  userId,
  email: `platform-ops-${runId}@example.test`,
  role: Role.SUPER_ADMIN,
  branchId,
  allowedBranchIds: [branchId],
  sessionId: randomUUID(),
};

async function main() {
  await prisma.branch.create({
    data: {
      id: branchId,
      name: `Platform operations ${runId}`,
      address: 'Test only',
    },
  });
  await prisma.user.create({
    data: {
      id: userId,
      email: actor.email,
      password: 'not-a-real-password',
      fullName: 'Platform operations test',
      role: Role.SUPER_ADMIN,
      branchId,
    },
  });

  const oldAudit = await prisma.auditEvent.create({
    data: {
      actorId: userId,
      branchId,
      action: 'TEST.OLD_AUDIT',
      resourceType: 'PlatformTest',
      resourceId: runId,
      correlationId: `old-audit-${runId}`,
      createdAt: oldDate,
    },
  });
  const recentAudit = await prisma.auditEvent.create({
    data: {
      actorId: userId,
      branchId,
      action: 'TEST.RECENT_AUDIT',
      resourceType: 'PlatformTest',
      resourceId: runId,
      correlationId: `recent-audit-${runId}`,
    },
  });

  const expiredIdempotency = await prisma.idempotencyRecord.create({
    data: {
      actorId: userId,
      scopeKey: branchId,
      action: 'PLATFORM_OPS_EXPIRED',
      key: `expired-${runId}`,
      requestHash: 'a'.repeat(64),
      status: IdempotencyStatus.COMPLETED,
      responseStatus: 200,
      responseBody: { ok: true },
      expiresAt: expiredDate,
    },
  });
  const effectiveIdempotency = await prisma.idempotencyRecord.create({
    data: {
      actorId: userId,
      scopeKey: branchId,
      action: 'PLATFORM_OPS_EFFECTIVE',
      key: `effective-${runId}`,
      requestHash: 'b'.repeat(64),
      status: IdempotencyStatus.COMPLETED,
      responseStatus: 200,
      responseBody: { ok: true },
      expiresAt: futureDate,
    },
  });
  const processingIdempotency = await prisma.idempotencyRecord.create({
    data: {
      actorId: userId,
      scopeKey: branchId,
      action: 'PLATFORM_OPS_PROCESSING',
      key: `processing-${runId}`,
      requestHash: 'c'.repeat(64),
      status: IdempotencyStatus.PROCESSING,
      expiresAt: expiredDate,
    },
  });

  const published = await prisma.outboxEvent.create({
    data: {
      aggregateType: 'PlatformTest',
      aggregateId: runId,
      eventType: 'test.published',
      payload: { runId },
      status: OutboxStatus.PUBLISHED,
      publishedAt: oldDate,
      correlationId: `published-${runId}`,
      createdAt: oldDate,
    },
  });
  const pending = await prisma.outboxEvent.create({
    data: {
      aggregateType: 'PlatformTest',
      aggregateId: runId,
      eventType: 'test.pending',
      payload: { runId },
      status: OutboxStatus.PENDING,
      correlationId: `pending-${runId}`,
      createdAt: oldDate,
    },
  });
  const replayTarget = await prisma.outboxEvent.create({
    data: {
      aggregateType: 'PlatformTest',
      aggregateId: runId,
      eventType: 'test.dead-letter.replay',
      payload: { runId },
      status: OutboxStatus.DEAD_LETTER,
      attempts: 10,
      lastError: 'Expected test failure',
      correlationId: `dead-letter-replay-${runId}`,
      createdAt: oldDate,
    },
  });
  const retainedDeadLetter = await prisma.outboxEvent.create({
    data: {
      aggregateType: 'PlatformTest',
      aggregateId: runId,
      eventType: 'test.dead-letter.retain',
      payload: { runId },
      status: OutboxStatus.DEAD_LETTER,
      attempts: 10,
      lastError: 'Expected retained failure',
      correlationId: `dead-letter-retain-${runId}`,
    },
  });

  const metrics = await operations.getMetrics(actor);
  if (metrics.deadLetterCount < 2 || metrics.actionableBacklog < 1) {
    throw new Error('Platform metrics did not report the test backlog');
  }
  const firstPage = await operations.findDeadLetters({ limit: 1 }, actor);
  if (firstPage.data.length !== 1 || !firstPage.nextCursor) {
    throw new Error('Dead-letter cursor page did not expose the next cursor');
  }
  const secondPage = await operations.findDeadLetters(
    { limit: 1, cursor: firstPage.nextCursor },
    actor,
  );
  if (
    secondPage.data.length !== 1 ||
    secondPage.data[0].id === firstPage.data[0].id
  ) {
    throw new Error(
      'Dead-letter cursor pagination repeated or lost the next row',
    );
  }

  const cleanup = await operations.runRetentionCleanup(
    { reason: 'Platform retention database verification', batchSize: 100 },
    actor,
    `cleanup-${runId}`,
  );
  if (
    cleanup.deletedAuditEvents !== 1 ||
    cleanup.deletedIdempotencyRecords !== 1 ||
    cleanup.deletedPublishedOutboxEvents !== 1
  ) {
    throw new Error(`Unexpected cleanup result: ${JSON.stringify(cleanup)}`);
  }
  const [oldAuditAfter, recentAuditAfter, expiredAfter, effectiveAfter] =
    await Promise.all([
      prisma.auditEvent.findUnique({ where: { id: oldAudit.id } }),
      prisma.auditEvent.findUnique({ where: { id: recentAudit.id } }),
      prisma.idempotencyRecord.findUnique({
        where: { id: expiredIdempotency.id },
      }),
      prisma.idempotencyRecord.findUnique({
        where: { id: effectiveIdempotency.id },
      }),
    ]);
  const [processingAfter, publishedAfter, pendingAfter, deadLetterAfter] =
    await Promise.all([
      prisma.idempotencyRecord.findUnique({
        where: { id: processingIdempotency.id },
      }),
      prisma.outboxEvent.findUnique({ where: { id: published.id } }),
      prisma.outboxEvent.findUnique({ where: { id: pending.id } }),
      prisma.outboxEvent.findUnique({
        where: { id: retainedDeadLetter.id },
      }),
    ]);
  if (
    oldAuditAfter ||
    expiredAfter ||
    publishedAfter ||
    !recentAuditAfter ||
    !effectiveAfter ||
    !processingAfter ||
    !pendingAfter ||
    !deadLetterAfter
  ) {
    throw new Error('Retention cleanup removed an ineligible record');
  }

  const replayed = await operations.replayDeadLetter(
    replayTarget.id,
    'Consumer configuration repaired',
    actor,
    `replay-${runId}`,
  );
  if (replayed.status !== OutboxStatus.PENDING || replayed.attempts !== 0) {
    throw new Error('Dead-letter replay did not reset the event');
  }
  const auditEvidence = await prisma.auditEvent.count({
    where: {
      actorId: userId,
      action: {
        in: ['PLATFORM.RETENTION_CLEANUP', 'PLATFORM.OUTBOX_REPLAYED'],
      },
    },
  });
  if (auditEvidence !== 2) {
    throw new Error(
      'Platform operations did not create complete audit evidence',
    );
  }

  console.log(
    'Platform operations database verification passed: metrics, cursor paging, bounded retention and audited replay',
  );
}

main()
  .finally(async () => {
    await prisma.auditEvent.deleteMany({ where: { actorId: userId } });
    await prisma.idempotencyRecord.deleteMany({ where: { actorId: userId } });
    await prisma.outboxEvent.deleteMany({
      where: { aggregateType: 'PlatformTest', aggregateId: runId },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
