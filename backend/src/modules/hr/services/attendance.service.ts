import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryAttendanceDto } from '../dto/query-attendance.dto';
import { CheckInDto } from '../dto/check-in.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: string, dto?: CheckInDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existing) {
      if (existing.checkIn) {
        throw new BadRequestException('Already checked in today');
      }
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          note: dto?.note || existing.note,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: new Date(),
        note: dto?.note,
      },
    });
  }

  async checkOut(userId: string, dto?: CheckInDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!existing || !existing.checkIn) {
      throw new BadRequestException('Not checked in today');
    }
    
    if (existing.checkOut) {
       throw new BadRequestException('Already checked out today');
    }

    const checkOut = new Date();
    const msDiff = checkOut.getTime() - existing.checkIn.getTime();
    const hoursWorked = msDiff / (1000 * 60 * 60);

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut,
        hoursWorked,
        note: dto?.note ? `${existing.note || ''} | ${dto.note}` : existing.note,
      },
    });
  }

  async findAll(query: QueryAttendanceDto) {
    const { skip, take, userId, startDate, endDate, branchId } = query;
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (branchId) {
      where.user = { branchId };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, fullName: true, branchId: true } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async getMyAttendance(userId: string, month?: number, year?: number) {
    const where: any = { userId };
    
    if (month && year) {
       const start = new Date(year, month - 1, 1);
       const end = new Date(year, month, 0);
       where.date = {
          gte: start,
          lte: end
       }
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }
}
