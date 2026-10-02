import './assert-test-database';
import { HttpException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { resolveBranchScope } from '../src/common/auth/branch-scope';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthThrottleService } from '../src/modules/auth/auth-throttle.service';
import { AuditService } from '../src/modules/platform/audit.service';
import { UsersService } from '../src/modules/users/users.service';

const prisma = new PrismaClient();

async function main() {
  const suffix = randomUUID();
  const branchIds = [randomUUID(), randomUUID()];
  const actorId = randomUUID();
  let userId: string | undefined;
  const throttleKey = `security-db:${suffix}`;
  const throttleHash = createHash('sha256').update(throttleKey).digest('hex');

  try {
    await prisma.branch.createMany({
      data: branchIds.map((id, index) => ({
        id,
        name: `Security test branch ${index + 1} ${suffix}`,
        address: 'Test only',
      })),
    });
    await prisma.user.create({
      data: {
        id: actorId,
        email: `security-actor-${suffix}@teap.test`,
        password: 'not-used',
        fullName: 'Security Test Actor',
        role: Role.SUPER_ADMIN,
      },
    });

    const usersService = new UsersService(
      prisma as unknown as PrismaService,
      new AuditService(),
    );
    const createdUser = await usersService.create(
      {
        email: `security-${suffix}@teap.test`,
        password: 'SecurityTestPassword1',
        fullName: 'Security Integration Test',
        role: Role.MANAGER,
        branchId: branchIds[0],
        branchIds,
      },
      {
        userId: actorId,
        email: `security-actor-${suffix}@teap.test`,
        role: Role.SUPER_ADMIN,
        branchId: null,
        allowedBranchIds: [],
        sessionId: 'security-test-session',
      },
      `security-db-${suffix}`,
    );
    userId = createdUser.id;

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { branchAssignments: { select: { branchId: true } } },
    });
    if (stored.branchAssignments.length !== 2) {
      throw new Error('Expected the account to retain two branch assignments');
    }

    const selected = resolveBranchScope(
      {
        userId,
        email: `security-${suffix}@teap.test`,
        role: Role.MANAGER,
        branchId: branchIds[0],
        allowedBranchIds: branchIds,
        sessionId: 'security-test-session',
      },
      branchIds[1],
    );
    if (selected !== branchIds[1]) {
      throw new Error('The second assigned branch was not authorized');
    }

    const auditCount = await prisma.auditEvent.count({
      where: {
        correlationId: `security-db-${suffix}`,
        action: 'USER_CREATED',
        resourceId: userId,
      },
    });
    if (auditCount !== 1) {
      throw new Error('Expected one audit record for the permission change');
    }

    const throttle = new AuthThrottleService(
      prisma as unknown as PrismaService,
    );
    await throttle.consume(throttleKey, 1, 60_000);
    try {
      await throttle.consume(throttleKey, 1, 60_000);
      throw new Error('Shared authentication rate limit did not reject');
    } catch (error) {
      if (!(error instanceof HttpException) || error.getStatus() !== 429) {
        throw error;
      }
    }

    console.log(
      'Security database verification passed: two-branch scope, permission audit and shared rate limit',
    );
  } finally {
    await prisma.authRateLimit.deleteMany({ where: { keyHash: throttleHash } });
    await prisma.auditEvent.deleteMany({
      where: { correlationId: `security-db-${suffix}` },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [actorId, ...(userId ? [userId] : [])] } },
    });
    await prisma.branch.deleteMany({ where: { id: { in: branchIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
