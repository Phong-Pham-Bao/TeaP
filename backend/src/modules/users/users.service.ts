import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../common/auth/branch-scope';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../platform/audit.service';

const OPERATIONAL_ROLES = new Set<Role>([
  Role.CASHIER,
  Role.KITCHEN_STAFF,
  Role.WAREHOUSE_STAFF,
]);

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  avatar: true,
  role: true,
  branchId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true } },
  branchAssignments: {
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
    select: {
      branchId: true,
      isPrimary: true,
      branch: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateUserDto,
    actor: AuthenticatedActor,
    correlationId = 'internal',
  ) {
    const scopedDto = this.scopeCreate(dto, actor);
    const { branchIds, ...data } = scopedDto;
    const assignmentBranchIds = this.normalizeBranchIds(
      data.branchId,
      branchIds,
    );
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) throw new ConflictException('Email already exists');

    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...data,
          email,
          password,
          branchAssignments: {
            create: assignmentBranchIds.map((branchId) => ({
              branchId,
              isPrimary: branchId === data.branchId,
            })),
          },
        },
        select: USER_SELECT,
      });
      await this.auditService.record(tx, {
        actorId: actor.userId,
        branchId: data.branchId,
        action: 'USER_CREATED',
        resourceType: 'User',
        resourceId: user.id,
        correlationId,
        metadata: {
          role: data.role,
          branchIds: assignmentBranchIds,
        },
      });
      return user;
    });
  }

  async findAll(query: QueryUserDto, actor: AuthenticatedActor) {
    const { skip, take, branchId, role, search } = query;
    const where: Prisma.UserWhereInput = { isActive: true };
    const filters: Prisma.UserWhereInput[] = [];

    if (actor.role === Role.MANAGER) {
      const scopedBranchId = resolveBranchScope(actor, branchId) as string;
      filters.push({
        OR: [
          { branchId: scopedBranchId },
          { branchAssignments: { some: { branchId: scopedBranchId } } },
        ],
      });
    } else if (branchId) {
      filters.push({
        OR: [{ branchId }, { branchAssignments: { some: { branchId } } }],
      });
    }

    if (role) where.role = role;
    if (search) {
      filters.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (filters.length > 0) where.AND = filters;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async findOne(id: string, actor: AuthenticatedActor) {
    const user = await this.getActiveUser(id);
    this.assertCanRead(
      user.branchAssignments.map((assignment) => assignment.branchId),
      user.branchId,
      actor,
    );
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthenticatedActor,
    correlationId = 'internal',
  ) {
    const target = await this.getActiveUser(id);
    this.assertCanMutate(
      target.role,
      target.branchAssignments.map((assignment) => assignment.branchId),
      target.branchId,
      actor,
    );

    const { branchIds, password, ...input } = dto;
    const data: Prisma.UserUncheckedUpdateInput = { ...input };
    if (dto.email) data.email = dto.email.trim().toLowerCase();
    if (password) data.password = await bcrypt.hash(password, 10);

    if (actor.role !== Role.SUPER_ADMIN) {
      if (dto.role && !OPERATIONAL_ROLES.has(dto.role)) {
        throw new ForbiddenException('Cannot assign this role');
      }
      if (actor.role === Role.MANAGER) {
        const requestedBranchIds = this.normalizeBranchIds(
          dto.branchId ?? target.branchId,
          branchIds,
        );
        this.assertBranchesWithinActorScope(requestedBranchIds, actor);
        data.branchId = dto.branchId ?? target.branchId;
      }
    }

    const assignmentsChanged =
      dto.branchId !== undefined || branchIds !== undefined;
    const primaryBranchId = dto.branchId ?? target.branchId;
    const assignmentBranchIds = assignmentsChanged
      ? this.normalizeBranchIds(primaryBranchId, branchIds)
      : [];

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data });

        if (assignmentsChanged) {
          await tx.userBranchAssignment.deleteMany({ where: { userId: id } });
          if (assignmentBranchIds.length > 0) {
            await tx.userBranchAssignment.createMany({
              data: assignmentBranchIds.map((branchId) => ({
                userId: id,
                branchId,
                isPrimary: branchId === primaryBranchId,
              })),
            });
          }
        }

        const updatedUser = await tx.user.findUniqueOrThrow({
          where: { id },
          select: USER_SELECT,
        });
        await this.auditService.record(tx, {
          actorId: actor.userId,
          branchId: updatedUser.branchId ?? undefined,
          action: 'USER_UPDATED',
          resourceType: 'User',
          resourceId: id,
          correlationId,
          metadata: {
            changedFields: Object.keys(dto),
            previousRole: target.role,
            nextRole: updatedUser.role,
            previousBranchIds: target.branchAssignments.map(
              (assignment) => assignment.branchId,
            ),
            nextBranchIds: updatedUser.branchAssignments.map(
              (assignment) => assignment.branchId,
            ),
          },
        });
        return updatedUser;
      });

      if (password || dto.role || assignmentsChanged) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: id, isRevoked: false },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      }
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(
    id: string,
    actor: AuthenticatedActor,
    correlationId = 'internal',
  ) {
    const target = await this.getActiveUser(id);
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can deactivate accounts');
    }
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true },
      });
      await tx.refreshToken.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      await this.auditService.record(tx, {
        actorId: actor.userId,
        branchId: target.branchId ?? undefined,
        action: 'USER_DEACTIVATED',
        resourceType: 'User',
        resourceId: id,
        correlationId,
      });
      return user;
    });
  }

  private scopeCreate(
    dto: CreateUserDto,
    actor: AuthenticatedActor,
  ): CreateUserDto {
    if (actor.role === Role.SUPER_ADMIN) return dto;
    if (!OPERATIONAL_ROLES.has(dto.role)) {
      throw new ForbiddenException('Cannot create an account with this role');
    }
    if (actor.role === Role.MANAGER) {
      const primaryBranchId = dto.branchId ?? actor.branchId ?? undefined;
      const branchIds = this.normalizeBranchIds(primaryBranchId, dto.branchIds);
      this.assertBranchesWithinActorScope(branchIds, actor);
      return { ...dto, branchId: primaryBranchId, branchIds };
    }
    return dto;
  }

  private async getActiveUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isActive: true },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  private assertCanRead(
    targetBranchIds: string[],
    legacyBranchId: string | null,
    actor: AuthenticatedActor,
  ): void {
    if (actor.role !== Role.MANAGER) return;
    const actorBranches = new Set([
      ...actor.allowedBranchIds,
      ...(actor.branchId ? [actor.branchId] : []),
    ]);
    const targetBranches = new Set([
      ...targetBranchIds,
      ...(legacyBranchId ? [legacyBranchId] : []),
    ]);
    if (![...targetBranches].some((branchId) => actorBranches.has(branchId))) {
      throw new ForbiddenException('User is outside your branch scope');
    }
  }

  private assertCanMutate(
    targetRole: Role,
    targetBranchIds: string[],
    legacyBranchId: string | null,
    actor: AuthenticatedActor,
  ): void {
    if (actor.role === Role.SUPER_ADMIN) return;
    if (!OPERATIONAL_ROLES.has(targetRole)) {
      throw new ForbiddenException('Cannot modify this account');
    }
    this.assertCanRead(targetBranchIds, legacyBranchId, actor);
  }

  private normalizeBranchIds(
    primaryBranchId?: string | null,
    branchIds?: string[],
  ): string[] {
    return Array.from(
      new Set([
        ...(primaryBranchId ? [primaryBranchId] : []),
        ...(branchIds ?? []),
      ]),
    );
  }

  private assertBranchesWithinActorScope(
    branchIds: string[],
    actor: AuthenticatedActor,
  ): void {
    const actorBranches = new Set([
      ...actor.allowedBranchIds,
      ...(actor.branchId ? [actor.branchId] : []),
    ]);
    if (
      branchIds.length === 0 ||
      branchIds.some((branchId) => !actorBranches.has(branchId))
    ) {
      throw new ForbiddenException('Cannot assign users outside your branches');
    }
  }
}
