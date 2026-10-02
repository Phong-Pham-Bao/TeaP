import './assert-test-database';
import {
  ApprovalDecisionType,
  ApprovalStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthenticatedActor } from '../src/common/types/authenticated-actor';
import { ApprovalService } from '../src/modules/platform/approval.service';
import { AuditService } from '../src/modules/platform/audit.service';

const prisma = new PrismaClient();
const approvalService = new ApprovalService(new AuditService());

function actor(
  userId: string,
  email: string,
  branchId: string,
): AuthenticatedActor {
  return {
    userId,
    email,
    role: Role.MANAGER,
    branchId,
    allowedBranchIds: [branchId],
    sessionId: randomUUID(),
  };
}

async function expectRejected(operation: Promise<unknown>, label: string) {
  const result = await Promise.allSettled([operation]);
  if (result[0].status !== 'rejected') {
    throw new Error(`${label} unexpectedly succeeded`);
  }
}

async function main() {
  const runId = randomUUID();
  const branchId = randomUUID();
  const otherBranchId = randomUUID();
  const requesterId = randomUUID();
  const approverAId = randomUUID();
  const approverBId = randomUUID();
  const outsiderId = randomUUID();
  const userIds = [requesterId, approverAId, approverBId, outsiderId];

  const requester = actor(
    requesterId,
    `approval-requester-${runId}@example.test`,
    branchId,
  );
  const approverA = actor(
    approverAId,
    `approval-a-${runId}@example.test`,
    branchId,
  );
  const approverB = actor(
    approverBId,
    `approval-b-${runId}@example.test`,
    branchId,
  );
  const outsider = actor(
    outsiderId,
    `approval-outsider-${runId}@example.test`,
    otherBranchId,
  );

  try {
    await prisma.branch.createMany({
      data: [
        {
          id: branchId,
          name: `Approval branch ${runId}`,
          address: 'Test only',
        },
        {
          id: otherBranchId,
          name: `Approval other branch ${runId}`,
          address: 'Test only',
        },
      ],
    });
    await prisma.user.createMany({
      data: [requester, approverA, approverB, outsider].map((value) => ({
        id: value.userId,
        email: value.email,
        password: 'not-a-real-password',
        fullName: 'Approval database test',
        role: Role.MANAGER,
        branchId: value.branchId,
      })),
    });

    const approval = await prisma.$transaction((tx) =>
      approvalService.request(
        tx,
        {
          resourceType: 'StockAdjustment',
          resourceId: `adjustment-${runId}`,
          action: 'POST',
          resourceVersion: 1,
          branchId,
          reason: 'Database concurrency verification',
        },
        requester,
        `approval-request-${runId}`,
      ),
    );

    await expectRejected(
      prisma.$transaction((tx) =>
        approvalService.decide(
          tx,
          {
            approvalRequestId: approval.id,
            decision: ApprovalDecisionType.APPROVED,
            currentResourceVersion: 1,
          },
          requester,
          `approval-self-${runId}`,
        ),
      ),
      'Self approval',
    );
    await expectRejected(
      prisma.$transaction((tx) =>
        approvalService.decide(
          tx,
          {
            approvalRequestId: approval.id,
            decision: ApprovalDecisionType.APPROVED,
            currentResourceVersion: 1,
          },
          outsider,
          `approval-outside-branch-${runId}`,
        ),
      ),
      'Out-of-branch approval',
    );

    const decisions = await Promise.allSettled([
      prisma.$transaction((tx) =>
        approvalService.decide(
          tx,
          {
            approvalRequestId: approval.id,
            decision: ApprovalDecisionType.APPROVED,
            currentResourceVersion: 1,
          },
          approverA,
          `approval-a-${runId}`,
        ),
      ),
      prisma.$transaction((tx) =>
        approvalService.decide(
          tx,
          {
            approvalRequestId: approval.id,
            decision: ApprovalDecisionType.APPROVED,
            currentResourceVersion: 1,
          },
          approverB,
          `approval-b-${runId}`,
        ),
      ),
    ]);
    const successfulDecisions = decisions.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    if (successfulDecisions !== 1) {
      throw new Error(
        `Expected one successful concurrent decision, got ${successfulDecisions}`,
      );
    }

    const [savedApproval, decisionCount, approvedAuditCount] =
      await Promise.all([
        prisma.approvalRequest.findUnique({ where: { id: approval.id } }),
        prisma.approvalDecision.count({
          where: { approvalRequestId: approval.id },
        }),
        prisma.auditEvent.count({
          where: {
            resourceId: approval.id,
            action: 'APPROVAL.APPROVED',
          },
        }),
      ]);
    if (savedApproval?.status !== ApprovalStatus.APPROVED) {
      throw new Error('The winning decision did not update approval status');
    }
    if (decisionCount !== 1 || approvedAuditCount !== 1) {
      throw new Error(
        `Expected one decision and one approval audit, got ${decisionCount}/${approvedAuditCount}`,
      );
    }

    const staleApproval = await prisma.$transaction((tx) =>
      approvalService.request(
        tx,
        {
          resourceType: 'StockAdjustment',
          resourceId: `stale-adjustment-${runId}`,
          action: 'POST',
          resourceVersion: 1,
          branchId,
        },
        requester,
        `approval-stale-request-${runId}`,
      ),
    );
    await expectRejected(
      prisma.$transaction((tx) =>
        approvalService.decide(
          tx,
          {
            approvalRequestId: staleApproval.id,
            decision: ApprovalDecisionType.APPROVED,
            currentResourceVersion: 2,
          },
          approverA,
          `approval-stale-decision-${runId}`,
        ),
      ),
      'Stale approval',
    );
    const staleStatus = await prisma.approvalRequest.findUnique({
      where: { id: staleApproval.id },
      select: { status: true },
    });
    if (staleStatus?.status !== ApprovalStatus.PENDING) {
      throw new Error('A stale decision changed the approval request');
    }

    console.log(
      'Approval database verification passed: self/scope/stale guards and exactly one concurrent decision',
    );
  } finally {
    await prisma.auditEvent.deleteMany({
      where: { correlationId: { contains: runId } },
    });
    await prisma.approvalDecision.deleteMany({
      where: { approvalRequest: { resourceId: { contains: runId } } },
    });
    await prisma.approvalRequest.deleteMany({
      where: { resourceId: { contains: runId } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.branch.deleteMany({
      where: { id: { in: [branchId, otherBranchId] } },
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
