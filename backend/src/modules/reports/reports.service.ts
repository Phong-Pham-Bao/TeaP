import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, GroupByTime } from './dto/report-query.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import {
  businessDateKey,
  businessDateStart,
  businessPeriodKey,
  businessTimestampRange,
  currentBusinessMonthRange,
  nextBusinessDateStart,
} from '../../common/time/business-time';
import {
  addVnd,
  vnd,
  vndToNumber,
} from '../../common/money/vietnamese-dong';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(query: ReportQueryDto) {
    const defaults = currentBusinessMonthRange();
    return {
      startDate: query.startDate ? businessDateStart(query.startDate) : defaults.gte,
      endExclusive: query.endDate
        ? nextBusinessDateStart(query.endDate)
        : defaults.lt,
    };
  }

  private formatDateString(date: Date, groupBy: GroupByTime): string {
    return businessPeriodKey(date, groupBy);
  }

  async getRevenueReport(query: ReportQueryDto) {
    const { startDate, endExclusive } = this.getDateRange(query);
    const { branchId, groupBy = GroupByTime.DAY } = query;

    const whereCondition: Prisma.OrderWhereInput = {
      status: OrderStatus.PAID,
      createdAt: {
        gte: startDate,
        lt: endExclusive,
      },
    };

    if (branchId) {
      whereCondition.branchId = branchId;
    }

    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      select: {
        totalAmount: true,
        discount: true,
        createdAt: true,
      },
    });

    let overallTotalOrders = 0;
    let overallTotalRevenue = vnd(0);
    let overallTotalDiscount = vnd(0);
    let overallNetRevenue = vnd(0);

    const groupedData = new Map<string, {
      date: string;
      totalOrders: number;
      totalRevenue: Prisma.Decimal;
      totalDiscount: Prisma.Decimal;
      netRevenue: Prisma.Decimal;
    }>();

    for (const order of orders) {
      const dateKey = this.formatDateString(new Date(order.createdAt), groupBy);
      
      const totalAmount = vnd(order.totalAmount);
      const discount = vnd(order.discount);
      
      overallTotalOrders++;
      overallTotalRevenue = addVnd(overallTotalRevenue, totalAmount);
      overallTotalDiscount = addVnd(overallTotalDiscount, discount);
      overallNetRevenue = addVnd(overallNetRevenue, totalAmount);

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          date: dateKey,
          totalOrders: 0,
          totalRevenue: vnd(0),
          totalDiscount: vnd(0),
          netRevenue: vnd(0),
        });
      }

      const current = groupedData.get(dateKey)!;
      current.totalOrders++;
      current.totalRevenue = addVnd(current.totalRevenue, totalAmount);
      current.totalDiscount = addVnd(current.totalDiscount, discount);
      current.netRevenue = addVnd(current.netRevenue, totalAmount);
    }

    return {
      summary: {
        totalOrders: overallTotalOrders,
        totalRevenue: vndToNumber(overallTotalRevenue),
        totalDiscount: vndToNumber(overallTotalDiscount),
        netRevenue: vndToNumber(overallNetRevenue),
      },
      data: Array.from(groupedData.values())
        .map((entry) => ({
          ...entry,
          totalRevenue: vndToNumber(entry.totalRevenue),
          totalDiscount: vndToNumber(entry.totalDiscount),
          netRevenue: vndToNumber(entry.netRevenue),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getTopProducts(query: ReportQueryDto) {
    const { startDate, endExclusive } = this.getDateRange(query);
    const { branchId } = query;

    const whereCondition: Prisma.OrderItemWhereInput = {
      order: {
        status: OrderStatus.PAID,
        createdAt: {
          gte: startDate,
          lt: endExclusive,
        },
        ...(branchId ? { branchId } : {}),
      },
    };

    const orderItems = await this.prisma.orderItem.findMany({
      where: whereCondition,
      select: {
        qty: true,
        subtotal: true,
        product: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const productMap = new Map<string, {
      productId: string;
      productName: string;
      totalQty: number;
      totalRevenue: Prisma.Decimal;
    }>();

    for (const item of orderItems) {
      const pId = item.product.id;
      if (!productMap.has(pId)) {
        productMap.set(pId, {
          productId: pId,
          productName: item.product.name,
          totalQty: 0,
          totalRevenue: vnd(0),
        });
      }
      const p = productMap.get(pId)!;
      p.totalQty += item.qty;
      p.totalRevenue = addVnd(p.totalRevenue, item.subtotal);
    }

    return Array.from(productMap.values())
      .map((entry) => ({
        ...entry,
        totalRevenue: vndToNumber(entry.totalRevenue),
      }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 20);
  }

  async getInventorySummary(branchId?: string) {
    const whereCondition = branchId ? { branchId } : {};

    const inventories = await this.prisma.inventory.findMany({
      where: whereCondition,
      include: {
        material: true,
        branch: true,
      },
    });

    return inventories.map(inv => {
      const currentStock = Number(inv.currentStock);
      const minStock = Number(inv.minStock);
      
      let status = 'OK';
      if (currentStock === 0) {
        status = 'OUT';
      } else if (currentStock < minStock) {
        status = 'LOW';
      }

      return {
        branchName: inv.branch.name,
        materialName: inv.material.name,
        currentStock,
        minStock,
        unit: inv.unit,
        status,
      };
    });
  }

  async getCashierPerformance(query: ReportQueryDto) {
    const { startDate, endExclusive } = this.getDateRange(query);
    const { branchId } = query;

    const whereCondition: Prisma.OrderWhereInput = {
      status: OrderStatus.PAID,
      createdAt: {
        gte: startDate,
        lt: endExclusive,
      },
    };

    if (branchId) {
      whereCondition.branchId = branchId;
    }

    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      select: {
        totalAmount: true,
        cashier: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });

    const cashierMap = new Map<string, {
      cashierId: string;
      cashierName: string;
      totalOrders: number;
      totalRevenue: Prisma.Decimal;
    }>();

    for (const order of orders) {
      const cId = order.cashier.id;
      if (!cashierMap.has(cId)) {
        cashierMap.set(cId, {
          cashierId: cId,
          cashierName: order.cashier.fullName,
          totalOrders: 0,
          totalRevenue: vnd(0),
        });
      }
      const c = cashierMap.get(cId)!;
      c.totalOrders++;
      c.totalRevenue = addVnd(c.totalRevenue, order.totalAmount);
    }

    return Array.from(cashierMap.values())
      .map((entry) => ({
        ...entry,
        totalRevenue: vndToNumber(entry.totalRevenue),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getDashboardSummary(branchId?: string) {
    const now = new Date();
    const today = businessDateKey(now);
    const todayRange = businessTimestampRange(today, today);
    const monthRange = currentBusinessMonthRange(now);

    const todayOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        createdAt: todayRange,
        ...(branchId ? { branchId } : {}),
      },
      select: { totalAmount: true }
    });

    const monthOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        createdAt: monthRange,
        ...(branchId ? { branchId } : {}),
      },
      select: { totalAmount: true, branchId: true, branch: { select: { name: true } } }
    });

    const totalCustomers = await this.prisma.customer.count({
      where: branchId ? { orders: { some: { branchId } } } : undefined,
    });

    const lowStockInventories = await this.prisma.inventory.findMany({
      where: branchId ? { branchId } : undefined,
      select: { currentStock: true, minStock: true }
    });
    
    let lowStockAlerts = 0;
    for (const inv of lowStockInventories) {
      if (Number(inv.currentStock) < Number(inv.minStock)) {
        lowStockAlerts++;
      }
    }

    const todayRevenue = vndToNumber(
      todayOrders.reduce(
        (sum, order) => addVnd(sum, order.totalAmount),
        vnd(0),
      ),
    );
    const monthRevenue = vndToNumber(
      monthOrders.reduce(
        (sum, order) => addVnd(sum, order.totalAmount),
        vnd(0),
      ),
    );

    const branchRevMap = new Map<string, Prisma.Decimal>();
    for (const o of monthOrders) {
      const branchName = o.branch.name;
      branchRevMap.set(
        branchName,
        addVnd(branchRevMap.get(branchName) ?? vnd(0), o.totalAmount),
      );
    }

    const revenueByBranch = Array.from(branchRevMap.entries()).map(([branchName, revenue]) => ({
      branchName,
      revenue: vndToNumber(revenue),
    }));

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      monthRevenue,
      monthOrders: monthOrders.length,
      totalCustomers,
      lowStockAlerts,
      revenueByBranch,
    };
  }
}
