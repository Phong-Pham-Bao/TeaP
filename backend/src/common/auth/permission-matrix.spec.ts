import { Role } from '@prisma/client';
import {
  PERMISSIONS,
  PERMISSION_MATRIX,
  roleHasEveryPermission,
  roleHasPermission,
} from './permission-matrix';

describe('permission matrix', () => {
  it('contains a non-empty, duplicate-free role list for every permission', () => {
    for (const roles of Object.values(PERMISSION_MATRIX)) {
      expect(roles.length).toBeGreaterThan(0);
      expect(new Set(roles).size).toBe(roles.length);
      expect(roles).toContain(Role.SUPER_ADMIN);
    }
  });

  it('keeps sensitive mutations away from operational roles', () => {
    expect(
      roleHasPermission(Role.WAREHOUSE_STAFF, PERMISSIONS.INVENTORY_TRANSFER),
    ).toBe(false);
    expect(roleHasPermission(Role.CASHIER, PERMISSIONS.POS_ORDER_CANCEL)).toBe(
      false,
    );
    expect(roleHasPermission(Role.HR, PERMISSIONS.USER_DELETE)).toBe(false);
    expect(
      roleHasPermission(Role.MANAGER, PERMISSIONS.PLATFORM_OUTBOX_REPLAY),
    ).toBe(false);
    expect(
      roleHasPermission(Role.ACCOUNTANT, PERMISSIONS.PLATFORM_RETENTION_RUN),
    ).toBe(false);
  });

  it('grants only the intended cross-domain read access', () => {
    expect(roleHasPermission(Role.ACCOUNTANT, PERMISSIONS.POS_ORDER_READ)).toBe(
      true,
    );
    expect(roleHasPermission(Role.ACCOUNTANT, PERMISSIONS.INVENTORY_READ)).toBe(
      false,
    );
    expect(
      roleHasPermission(
        Role.WAREHOUSE_STAFF,
        PERMISSIONS.REPORT_INVENTORY_READ,
      ),
    ).toBe(true);
    expect(
      roleHasPermission(Role.KITCHEN_STAFF, PERMISSIONS.REPORT_SALES_READ),
    ).toBe(false);
  });

  it('requires every permission when a route declares more than one', () => {
    expect(
      roleHasEveryPermission(Role.MANAGER, [
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_TRANSFER,
      ]),
    ).toBe(true);
    expect(
      roleHasEveryPermission(Role.WAREHOUSE_STAFF, [
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_TRANSFER,
      ]),
    ).toBe(false);
  });
});
