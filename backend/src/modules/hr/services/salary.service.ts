import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSalarySlipDto } from '../dto/create-salary-slip.dto';
import { QuerySalaryDto } from '../dto/query-salary.dto';
import { Prisma } from '@prisma/client';
import { paginate } from '../../../common/dto/pagination.dto';
import { toSalarySlipResponse } from '../dto/hr-response.dto';

@Injectable()
export class SalaryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalarySlipDto) {
    const existing = await this.prisma.salarySlip.findUnique({
      where: {
        userId_month_year: {
          userId: dto.userId,
          month: dto.month,
          year: dto.year,
        }
      }
    });

    if (existing) {
      throw new ConflictException('Salary slip already exists for this user, month and year');
    }

    const netSalary = dto.baseSalary + (dto.bonus || 0) - (dto.deduction || 0);

    const slip = await this.prisma.salarySlip.create({
      data: {
        userId: dto.userId,
        month: dto.month,
        year: dto.year,
        baseSalary: dto.baseSalary,
        bonus: dto.bonus || 0,
        deduction: dto.deduction || 0,
        netSalary,
        note: dto.note,
      }
    });
    return toSalarySlipResponse(slip);
  }

  async findAll(query: QuerySalaryDto) {
    const { skip, take, userId, month, year, isPaid } = query;
    const where: Prisma.SalarySlipWhereInput = {};

    if (userId) where.userId = userId;
    if (month) where.month = month;
    if (year) where.year = year;
    if (isPaid !== undefined) where.isPaid = isPaid;

    const [data, total] = await Promise.all([
      this.prisma.salarySlip.findMany({
        where,
        skip,
        take,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          user: { select: { id: true, fullName: true, branchId: true } }
        }
      }),
      this.prisma.salarySlip.count({ where }),
    ]);

    return paginate(
      data.map(toSalarySlipResponse),
      total,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  async getMySlips(userId: string) {
    const slips = await this.prisma.salarySlip.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return slips.map(toSalarySlipResponse);
  }

  async markAsPaid(id: string) {
    const slip = await this.prisma.salarySlip.findUnique({ where: { id } });
    if (!slip) {
      throw new NotFoundException('Salary slip not found');
    }

    const paidSlip = await this.prisma.salarySlip.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      }
    });
    return toSalarySlipResponse(paidSlip);
  }
}
