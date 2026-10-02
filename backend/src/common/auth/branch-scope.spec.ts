import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedActor } from '../types/authenticated-actor';
import { assertBranchScope, resolveBranchScope } from './branch-scope';

function actor(
  role: Role,
  branchId: string | null,
  allowedBranchIds: string[] = branchId ? [branchId] : [],
): AuthenticatedActor {
  return {
    userId: 'user-1',
    email: 'user@teap.test',
    role,
    branchId,
    allowedBranchIds,
    sessionId: 'session-1',
  };
}

describe('branch scope', () => {
  it('forces a branch employee to the server-side assignment', () => {
    expect(resolveBranchScope(actor(Role.MANAGER, 'branch-a'))).toBe('branch-a');
  });

  it('rejects a requested branch outside the assignment', () => {
    expect(() =>
      resolveBranchScope(actor(Role.MANAGER, 'branch-a'), 'branch-b'),
    ).toThrow(ForbiddenException);
  });

  it('allows either assigned branch when a multi-branch account selects it', () => {
    const multiBranchActor = actor(Role.MANAGER, 'branch-a', [
      'branch-a',
      'branch-b',
    ]);
    expect(resolveBranchScope(multiBranchActor, 'branch-a')).toBe('branch-a');
    expect(resolveBranchScope(multiBranchActor, 'branch-b')).toBe('branch-b');
  });

  it('fails closed when a multi-branch account does not select a branch', () => {
    expect(() =>
      resolveBranchScope(
        actor(Role.MANAGER, 'branch-a', ['branch-a', 'branch-b']),
      ),
    ).toThrow('Branch must be selected');
  });

  it('rejects branch-scoped actors without an assignment', () => {
    expect(() => resolveBranchScope(actor(Role.CASHIER, null))).toThrow(
      ForbiddenException,
    );
  });

  it('allows only configured global roles to cross branches', () => {
    expect(() =>
      assertBranchScope(actor(Role.SUPER_ADMIN, null), 'branch-b'),
    ).not.toThrow();
    expect(() =>
      assertBranchScope(
        actor(Role.ACCOUNTANT, null),
        'branch-b',
        [Role.SUPER_ADMIN, Role.ACCOUNTANT],
      ),
    ).not.toThrow();
  });
});
