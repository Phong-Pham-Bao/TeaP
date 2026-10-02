import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { QueryCashFlowDto } from './dto/query-cash-flow.dto';
import { CashFlowType, Prisma } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import { businessDateKey, businessTimestampRange } from '../../common/time/business-time';
import {
  addVnd,
  subtractVnd,
  vnd,
  vndToNumber,
} from '../../common/money/vietnamese-dong';
import { toCashFlowResponse } from './dto/cash-flow-response.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCashFlowDto: CreateCashFlowDto, userId: string) {
    const cashFlow = await this.prisma.cashFlow.create({
      data: {
        ...createCashFlowDto,
        amount: vnd(createCashFlowDto.amount),
        createdBy: userId,
      },
    });
    return toCashFlowResponse(cashFlow);
  }

  async findAll(query: QueryCashFlowDto) {
    const { skip, take, branchId, type, startDate, endDate } = query;
    const where: Prisma.CashFlowWhereInput = {};

    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = businessTimestampRange(startDate, endDate);
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

    return paginate(
      data.map(toCashFlowResponse),
      total,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  async getSummary(branchId?: string, startDate?: string, endDate?: string) {
    const where: Prisma.CashFlowWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.createdAt = businessTimestampRange(startDate, endDate);
    }

    const cashFlows = await this.prisma.cashFlow.findMany({
      where,
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
    });

    let totalIncome = vnd(0);
    let totalExpense = vnd(0);
    const groupedByDate: Record<
      string,
      { income: Prisma.Decimal; expense: Prisma.Decimal }
    > = {};

    cashFlows.forEach((cf) => {
      const amount = vnd(cf.amount);
      const dateStr = businessDateKey(cf.createdAt);

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { income: vnd(0), expense: vnd(0) };
      }

      if (cf.type === CashFlowType.INCOME) {
        totalIncome = addVnd(totalIncome, amount);
        groupedByDate[dateStr].income = addVnd(
          groupedByDate[dateStr].income,
          amount,
        );
      } else {
        totalExpense = addVnd(totalExpense, amount);
        groupedByDate[dateStr].expense = addVnd(
          groupedByDate[dateStr].expense,
          amount,
        );
      }
    });

    return {
      totalIncome: vndToNumber(totalIncome),
      totalExpense: vndToNumber(totalExpense),
      netCashFlow: vndToNumber(subtractVnd(totalIncome, totalExpense)),
      groupedByDate: Object.fromEntries(
        Object.entries(groupedByDate).map(([date, amounts]) => [
          date,
          {
            income: vndToNumber(amounts.income),
            expense: vndToNumber(amounts.expense),
          },
        ]),
      ),
    };
  }
}
