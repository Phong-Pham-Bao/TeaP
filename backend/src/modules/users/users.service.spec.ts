import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';
import { AuditService } from '../platform/audit.service';

describe('UsersService authorization', () => {
  const manager: AuthenticatedActor = {
    userId: 'manager-a',
    email: 'manager@teap.vn',
    role: Role.MANAGER,
    branchId: 'branch-a',
    allowedBranchIds: ['branch-a'],
    sessionId: 'session-a',
  };

  function createService() {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    return {
      service: new UsersService(
        prisma as unknown as PrismaService,
        { record: jest.fn() } as unknown as AuditService,
      ),
      prisma,
    };
  }

  it('does not let a manager create a privileged role', async () => {
    const { service } = createService();
    await expect(
      service.create(
        {
          email: 'admin2@teap.vn',
          password: 'Admin@123',
          fullName: 'Admin 2',
          role: Role.SUPER_ADMIN,
          branchId: 'branch-a',
        },
        manager,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not let a manager create an account in another branch', async () => {
    const { service } = createService();
    await expect(
      service.create(
        {
          email: 'cashier-b@teap.vn',
          password: 'Cashier@123',
          fullName: 'Cashier B',
          role: Role.CASHIER,
          branchId: 'branch-b',
        },
        manager,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a manager list query for an unassigned branch', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);

    const query = Object.assign(new QueryUserDto(), {
      page: 1,
      limit: 20,
      branchId: 'branch-b',
    });
    await expect(service.findAll(query, manager)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('scopes a manager list query to an explicitly selected assigned branch', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);

    const query = Object.assign(new QueryUserDto(), {
      page: 1,
      limit: 20,
      branchId: 'branch-a',
    });
    await service.findAll(query, manager);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ branchId: 'branch-a' }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('rejects reading a user whose target id resolves outside the actor branches', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      id: 'cashier-b',
      role: Role.CASHIER,
      branchId: 'branch-b',
      branchAssignments: [{ branchId: 'branch-b' }],
    });

    await expect(service.findOne('cashier-b', manager)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects updating a user whose target id resolves outside the actor branches', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      id: 'cashier-b',
      role: Role.CASHIER,
      branchId: 'branch-b',
      branchAssignments: [{ branchId: 'branch-b' }],
    });

    await expect(
      service.update('cashier-b', { fullName: 'Changed' }, manager),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('keeps account deactivation restricted in the service layer', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      id: 'cashier-a',
      role: Role.CASHIER,
      branchId: 'branch-a',
      branchAssignments: [{ branchId: 'branch-a' }],
    });

    await expect(service.remove('cashier-a', manager)).rejects.toThrow(
      'Only super admins',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
