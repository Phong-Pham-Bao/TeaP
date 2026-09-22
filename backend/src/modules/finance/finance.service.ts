import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { QueryCashFlowDto } from './dto/query-cash-flow.dto';
import { CashFlowType } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCashFlowDto: CreateCashFlowDto, userId: string) {
    return this.prisma.cashFlow.create({
      data: {
        ...createCashFlowDto,
        createdBy: userId,
      },
    });
  }

  async findAll(query: QueryCashFlowDto) {
    const { skip, take, branchId, type, startDate, endDate } = query;
    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.cashFlow.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: {
            select: { name: true },
          },
        },
      }),
      this.prisma.cashFlow.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async getSummary(branchId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const cashFlows = await this.prisma.cashFlow.findMany({
      where,
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const groupedByDate: Record<string, { income: number; expense: number }> = {};

    cashFlows.forEach((cf: any) => {
      const amount = Number(cf.amount);
      const dateStr = cf.createdAt.toISOString().split('T')[0];

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { income: 0, expense: 0 };
      }

      if (cf.type === CashFlowType.INCOME) {
        totalIncome += amount;
        groupedByDate[dateStr].income += amount;
      } else {
        totalExpense += amount;
        groupedByDate[dateStr].expense += amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      groupedByDate,
    };
  }
}
