import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryAttendanceDto } from '../dto/query-attendance.dto';
import { CheckInDto } from '../dto/check-in.dto';
import { Prisma } from '@prisma/client';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  businessDateColumnRange,
  businessDateValue,
  businessMonthDateRange,
} from '../../../common/time/business-time';
import { toAttendanceResponse } from '../dto/hr-response.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: string, dto?: CheckInDto) {
    const today = businessDateValue();

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
      const attendance = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          note: dto?.note || existing.note,
        },
      });
      return toAttendanceResponse(attendance);
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: new Date(),
        note: dto?.note,
      },
    });
    return toAttendanceResponse(attendance);
  }

  async checkOut(userId: string, dto?: CheckInDto) {
    const today = businessDateValue();

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

    const attendance = await this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut,
        hoursWorked,
        note: dto?.note ? `${existing.note || ''} | ${dto.note}` : existing.note,
      },
    });
    return toAttendanceResponse(attendance);
  }

  async findAll(query: QueryAttendanceDto) {
    const { skip, take, userId, startDate, endDate, branchId } = query;
    const where: Prisma.AttendanceWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = businessDateColumnRange(startDate, endDate);
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

    return paginate(
      data.map(toAttendanceResponse),
      total,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  async getMyAttendance(userId: string, month?: number, year?: number) {
    const where: Prisma.AttendanceWhereInput = { userId };
    
    if (month && year) {
       where.date = businessMonthDateRange(month, year);
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return records.map(toAttendanceResponse);
  }
}
