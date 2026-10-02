import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { assertBranchScope } from '../../../common/auth/branch-scope';
import { Prisma, Role } from '@prisma/client';
import { paginate } from '../../../common/dto/pagination.dto';
import { businessDateColumn, businessDateColumnRange } from '../../../common/time/business-time';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    const employee = await this.prisma.user.findFirst({
      where: { id: dto.userId, isActive: true },
      select: { branchId: true },
    });
    if (!employee || employee.branchId !== dto.branchId) {
      throw new ConflictException('Employee is not assigned to the schedule branch');
    }
    const existing = await this.prisma.workSchedule.findUnique({
      where: {
        userId_date_shiftName: {
          userId: dto.userId,
          date: businessDateColumn(dto.date),
          shiftName: dto.shiftName,
        }
      }
    });

    if (existing) {
      throw new ConflictException('Schedule already exists for this user, date and shift');
    }

    return this.prisma.workSchedule.create({
      data: {
        userId: dto.userId,
        branchId: dto.branchId,
        date: businessDateColumn(dto.date),
        shiftName: dto.shiftName,
        startTime: dto.startTime,
        endTime: dto.endTime,
      }
    });
  }

  async createBulk(dtos: CreateScheduleDto[]) {
    const results = [];
    for (const dto of dtos) {
      try {
        const schedule = await this.create(dto);
        results.push(schedule);
      } catch (error) {
        // Skip on conflict
      }
    }
    return results;
  }

  async findAll(query: QueryScheduleDto) {
    const { skip, take, userId, branchId, startDate, endDate } = query;
    const where: Prisma.WorkScheduleWhereInput = {};

    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.date = businessDateColumnRange(startDate, endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.workSchedule.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true } }
        }
      }),
      this.prisma.workSchedule.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 20);
  }

  async getMySchedule(userId: string, startDate?: string, endDate?: string) {
    const where: Prisma.WorkScheduleWhereInput = { userId };
    if (startDate || endDate) {
      where.date = businessDateColumnRange(startDate, endDate);
    }

    return this.prisma.workSchedule.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
         branch: { select: { id: true, name: true } }
      }
    });
  }

  async remove(id: string, actor: AuthenticatedActor) {
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    assertBranchScope(actor, schedule.branchId, [Role.SUPER_ADMIN, Role.HR]);
    return this.prisma.workSchedule.delete({ where: { id } });
  }
}
