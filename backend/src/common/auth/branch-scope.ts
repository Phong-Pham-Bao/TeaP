import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedActor } from '../types/authenticated-actor';

export function getAssignedBranchIds(actor: AuthenticatedActor): string[] {
  return Array.from(
    new Set([
      ...(actor.allowedBranchIds ?? []),
      ...(actor.branchId ? [actor.branchId] : []),
    ]),
  );
}

export function resolveBranchScope(
  actor: AuthenticatedActor,
  requestedBranchId?: string,
  globalRoles: readonly Role[] = [Role.SUPER_ADMIN],
): string | undefined {
  if (globalRoles.includes(actor.role)) return requestedBranchId;

  const assignedBranchIds = getAssignedBranchIds(actor);
  if (assignedBranchIds.length === 0) {
    throw new ForbiddenException('Account has no branch assignment');
  }

  if (requestedBranchId && !assignedBranchIds.includes(requestedBranchId)) {
    throw new ForbiddenException('Branch is outside your assigned scope');
  }
  if (requestedBranchId) return requestedBranchId;
  if (assignedBranchIds.length > 1) {
    throw new ForbiddenException(
      'Branch must be selected for a multi-branch account',
    );
  }
  return assignedBranchIds[0];
}

export function assertBranchScope(
  actor: AuthenticatedActor,
  resourceBranchId: string,
  globalRoles: readonly Role[] = [Role.SUPER_ADMIN],
): void {
  resolveBranchScope(actor, resourceBranchId, globalRoles);
}
