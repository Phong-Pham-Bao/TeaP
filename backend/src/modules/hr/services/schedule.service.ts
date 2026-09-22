import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    const existing = await this.prisma.workSchedule.findUnique({
      where: {
        userId_date_shiftName: {
          userId: dto.userId,
          date: new Date(dto.date),
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
        date: new Date(dto.date),
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
    const where: any = {};

    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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

    return { data, total, page: query.page, limit: query.limit };
  }

  async getMySchedule(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.workSchedule.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
         branch: { select: { id: true, name: true } }
      }
    });
  }

  async remove(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return this.prisma.workSchedule.delete({ where: { id } });
  }
}
