import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalDecisionType,
  ApprovalStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { assertBranchScope } from '../../common/auth/branch-scope';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { AuditService } from './audit.service';

export interface CreateApprovalRequestInput {
  resourceType: string;
  resourceId: string;
  action: string;
  resourceVersion: number;
  branchId: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface DecideApprovalInput {
  approvalRequestId: string;
  decision: ApprovalDecisionType;
  currentResourceVersion: number;
  reason?: string;
}

const APPROVER_ROLES: readonly Role[] = [Role.SUPER_ADMIN, Role.MANAGER];

@Injectable()
export class ApprovalService {
  constructor(private readonly audit: AuditService) {}

  async request(
    tx: Prisma.TransactionClient,
    input: CreateApprovalRequestInput,
    actor: AuthenticatedActor,
    correlationId: string,
  ) {
    this.assertApproverRole(actor);
    assertBranchScope(actor, input.branchId);
    if (!Number.isInteger(input.resourceVersion) || input.resourceVersion < 1) {
      throw new BadRequestException(
        'Resource version must be a positive integer',
      );
    }

    const approval = await tx.approvalRequest.create({
      data: {
        ...input,
        requestedById: actor.userId,
      },
    });
    await this.audit.record(tx, {
      actorId: actor.userId,
      branchId: input.branchId,
      action: 'APPROVAL.REQUESTED',
      resourceType: 'ApprovalRequest',
      resourceId: approval.id,
      reason: input.reason,
      metadata: {
        targetType: input.resourceType,
        targetId: input.resourceId,
        targetAction: input.action,
        resourceVersion: input.resourceVersion,
      },
      correlationId,
    });
    return approval;
  }

  async decide(
    tx: Prisma.TransactionClient,
    input: DecideApprovalInput,
    actor: AuthenticatedActor,
    correlationId: string,
  ) {
    this.assertApproverRole(actor);
    await tx.$queryRaw`
      SELECT id
      FROM approval_requests
      WHERE id = ${input.approvalRequestId}
      FOR UPDATE
    `;
    const approval = await tx.approvalRequest.findUnique({
      where: { id: input.approvalRequestId },
    });
    if (!approval) throw new NotFoundException('Approval request not found');

    assertBranchScope(actor, approval.branchId);
    if (approval.requestedById === actor.userId) {
      throw new ForbiddenException(
        'The requester cannot decide their own approval',
      );
    }
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ConflictException('Approval request is already decided');
    }
    if (approval.resourceVersion !== input.currentResourceVersion) {
      throw new ConflictException(
        'The resource changed after this approval was requested',
      );
    }
    if (
      input.decision === ApprovalDecisionType.REJECTED &&
      !input.reason?.trim()
    ) {
      throw new BadRequestException('A rejection reason is required');
    }

    await tx.approvalDecision.create({
      data: {
        approvalRequestId: approval.id,
        decision: input.decision,
        decidedById: actor.userId,
        reason: input.reason?.trim() || undefined,
      },
    });
    const status =
      input.decision === ApprovalDecisionType.APPROVED
        ? ApprovalStatus.APPROVED
        : ApprovalStatus.REJECTED;
    const updated = await tx.approvalRequest.update({
      where: { id: approval.id },
      data: { status },
    });
    await this.audit.record(tx, {
      actorId: actor.userId,
      branchId: approval.branchId,
      action: `APPROVAL.${status}`,
      resourceType: 'ApprovalRequest',
      resourceId: approval.id,
      reason: input.reason?.trim() || undefined,
      metadata: {
        targetType: approval.resourceType,
        targetId: approval.resourceId,
        targetAction: approval.action,
        resourceVersion: approval.resourceVersion,
      },
      correlationId,
    });
    return updated;
  }

  private assertApproverRole(actor: AuthenticatedActor): void {
    if (!APPROVER_ROLES.includes(actor.role)) {
      throw new ForbiddenException(
        'Account cannot request or decide approvals',
      );
    }
  }
}
