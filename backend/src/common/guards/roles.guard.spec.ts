import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AUTHENTICATED_ACCESS_KEY } from '../decorators/authenticated-access.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS } from '../auth/permission-matrix';
import { RolesGuard } from './roles.guard';

function contextFor(role?: Role): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function guardWith(metadata: Record<string, unknown>) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => metadata[key]),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('allows routes explicitly marked public', () => {
    const guard = guardWith({ [IS_PUBLIC_KEY]: true });
    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('allows routes explicitly marked for any authenticated user', () => {
    const guard = guardWith({ [AUTHENTICATED_ACCESS_KEY]: true });
    expect(guard.canActivate(contextFor(Role.CASHIER))).toBe(true);
  });

  it('fails closed when an authenticated route has no access policy', () => {
    const guard = guardWith({});
    expect(() => guard.canActivate(contextFor(Role.CASHIER))).toThrow(
      ForbiddenException,
    );
  });

  it('enforces configured roles and preserves the super-admin bypass', () => {
    const guard = guardWith({ [ROLES_KEY]: [Role.MANAGER] });
    expect(guard.canActivate(contextFor(Role.MANAGER))).toBe(true);
    expect(guard.canActivate(contextFor(Role.SUPER_ADMIN))).toBe(true);
    expect(guard.canActivate(contextFor(Role.CASHIER))).toBe(false);
  });

  it('enforces permissions from the centralized matrix', () => {
    const guard = guardWith({
      [PERMISSIONS_KEY]: [PERMISSIONS.INVENTORY_TRANSFER],
    });
    expect(guard.canActivate(contextFor(Role.MANAGER))).toBe(true);
    expect(guard.canActivate(contextFor(Role.SUPER_ADMIN))).toBe(true);
    expect(guard.canActivate(contextFor(Role.WAREHOUSE_STAFF))).toBe(false);
  });

  it('fails closed when a route mixes legacy roles and permissions', () => {
    const guard = guardWith({
      [ROLES_KEY]: [Role.MANAGER],
      [PERMISSIONS_KEY]: [PERMISSIONS.REPORT_SALES_READ],
    });
    expect(() => guard.canActivate(contextFor(Role.MANAGER))).toThrow(
      'cannot combine role and permission',
    );
  });
});
