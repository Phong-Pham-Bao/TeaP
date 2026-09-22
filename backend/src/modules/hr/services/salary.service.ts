import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSalarySlipDto } from '../dto/create-salary-slip.dto';
import { QuerySalaryDto } from '../dto/query-salary.dto';

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

    return this.prisma.salarySlip.create({
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
  }

  async findAll(query: QuerySalaryDto) {
    const { skip, take, userId, month, year, isPaid } = query;
    const where: any = {};

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

    return { data, total, page: query.page, limit: query.limit };
  }

  async getMySlips(userId: string) {
    return this.prisma.salarySlip.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async markAsPaid(id: string) {
    const slip = await this.prisma.salarySlip.findUnique({ where: { id } });
    if (!slip) {
      throw new NotFoundException('Salary slip not found');
    }

    return this.prisma.salarySlip.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      }
    });
  }
}
