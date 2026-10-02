import { ApprovalDecisionType, ApprovalStatus, Role } from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { ApprovalService } from './approval.service';

const requester: AuthenticatedActor = {
  userId: 'manager-a',
  email: 'manager-a@teap.test',
  role: Role.MANAGER,
  branchId: 'branch-a',
  allowedBranchIds: ['branch-a'],
  sessionId: 'session-a',
};
const approver: AuthenticatedActor = {
  ...requester,
  userId: 'manager-b',
  email: 'manager-b@teap.test',
};

describe('ApprovalService', () => {
  const audit = { record: jest.fn() };
  const service = new ApprovalService(audit as never);

  beforeEach(() => jest.clearAllMocks());

  function transaction(overrides: Record<string, unknown> = {}) {
    return {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'approval-1' }]),
      approvalRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'approval-1',
          resourceType: 'Stocktake',
          resourceId: 'stocktake-1',
          action: 'POST',
          resourceVersion: 3,
          branchId: 'branch-a',
          requestedById: requester.userId,
          status: ApprovalStatus.PENDING,
        }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({
          id: 'approval-1',
          status: ApprovalStatus.APPROVED,
        }),
      },
      approvalDecision: { create: jest.fn() },
      ...overrides,
    };
  }

  it('prevents the requester from approving their own request', async () => {
    const tx = transaction();
    await expect(
      service.decide(
        tx as never,
        {
          approvalRequestId: 'approval-1',
          decision: ApprovalDecisionType.APPROVED,
          currentResourceVersion: 3,
        },
        requester,
        'correlation-1',
      ),
    ).rejects.toThrow('cannot decide their own');
    expect(tx.approvalDecision.create).not.toHaveBeenCalled();
  });

  it('rejects an approval when the resource version is stale', async () => {
    const tx = transaction();
    await expect(
      service.decide(
        tx as never,
        {
          approvalRequestId: 'approval-1',
          decision: ApprovalDecisionType.APPROVED,
          currentResourceVersion: 4,
        },
        approver,
        'correlation-1',
      ),
    ).rejects.toThrow('changed after');
    expect(tx.approvalDecision.create).not.toHaveBeenCalled();
  });

  it('requires a reason when rejecting', async () => {
    const tx = transaction();
    await expect(
      service.decide(
        tx as never,
        {
          approvalRequestId: 'approval-1',
          decision: ApprovalDecisionType.REJECTED,
          currentResourceVersion: 3,
        },
        approver,
        'correlation-1',
      ),
    ).rejects.toThrow('rejection reason');
  });

  it('records the decision, status transition and audit together', async () => {
    const tx = transaction();
    await service.decide(
      tx as never,
      {
        approvalRequestId: 'approval-1',
        decision: ApprovalDecisionType.APPROVED,
        currentResourceVersion: 3,
        reason: 'Verified count',
      },
      approver,
      'correlation-1',
    );

    expect(tx.approvalDecision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ decidedById: approver.userId }),
    });
    expect(tx.approvalRequest.update).toHaveBeenCalledWith({
      where: { id: 'approval-1' },
      data: { status: ApprovalStatus.APPROVED },
    });
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: 'APPROVAL.APPROVED' }),
    );
  });
});
