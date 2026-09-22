import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, GroupByTime } from './dto/report-query.dto';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(query: ReportQueryDto) {
    const today = new Date();
    
    let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (query.startDate) {
      startDate = new Date(query.startDate);
    }
    
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private formatDateString(date: Date, groupBy: GroupByTime): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    if (groupBy === GroupByTime.DAY) {
      return `${y}-${m}-${d}`;
    } else if (groupBy === GroupByTime.MONTH) {
      return `${y}-${m}`;
    } else {
      // WEEK
      const firstDayOfYear = new Date(y, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${y}-W${String(weekNum).padStart(2, '0')}`;
    }
  }

  async getRevenueReport(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const { branchId, groupBy = GroupByTime.DAY } = query;

    const whereCondition: any = {
      status: OrderStatus.PAID,
      createdAt: {
        gte: startDate,
        lte: endDate,
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
    let overallTotalRevenue = 0;
    let overallTotalDiscount = 0;
    let overallNetRevenue = 0;

    const groupedData = new Map<string, any>();

    for (const order of orders) {
      const dateKey = this.formatDateString(new Date(order.createdAt), groupBy);
      
      const totalAmount = Number(order.totalAmount) || 0;
      const discount = Number(order.discount) || 0;
      const net = totalAmount; // Assuming totalAmount is already after discount based on POS logic, or totalAmount = subtotal - discount.
      
      overallTotalOrders++;
      overallTotalRevenue += totalAmount; // Using totalAmount as net
      overallTotalDiscount += discount;
      overallNetRevenue += totalAmount;

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          date: dateKey,
          totalOrders: 0,
          totalRevenue: 0, // treating totalRevenue as net revenue for now
          totalDiscount: 0,
          netRevenue: 0,
        });
      }

      const current = groupedData.get(dateKey);
      current.totalOrders++;
      current.totalRevenue += totalAmount;
      current.totalDiscount += discount;
      current.netRevenue += totalAmount;
    }

    return {
      summary: {
        totalOrders: overallTotalOrders,
        totalRevenue: overallTotalRevenue,
        totalDiscount: overallTotalDiscount,
        netRevenue: overallNetRevenue,
      },
      data: Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getTopProducts(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const { branchId } = query;

    const whereCondition: any = {
      order: {
        status: OrderStatus.PAID,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (branchId) {
      whereCondition.order.branchId = branchId;
    }

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

    const productMap = new Map<string, any>();

    for (const item of orderItems) {
      const pId = item.product.id;
      if (!productMap.has(pId)) {
        productMap.set(pId, {
          productId: pId,
          productName: item.product.name,
          totalQty: 0,
          totalRevenue: 0,
        });
      }
      const p = productMap.get(pId);
      p.totalQty += item.qty;
      p.totalRevenue += Number(item.subtotal) || 0;
    }

    return Array.from(productMap.values())
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
    const { startDate, endDate } = this.getDateRange(query);
    const { branchId } = query;

    const whereCondition: any = {
      status: OrderStatus.PAID,
      createdAt: {
        gte: startDate,
        lte: endDate,
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

    const cashierMap = new Map<string, any>();

    for (const order of orders) {
      const cId = order.cashier.id;
      if (!cashierMap.has(cId)) {
        cashierMap.set(cId, {
          cashierId: cId,
          cashierName: order.cashier.fullName,
          totalOrders: 0,
          totalRevenue: 0,
        });
      }
      const c = cashierMap.get(cId);
      c.totalOrders++;
      c.totalRevenue += Number(order.totalAmount) || 0;
    }

    return Array.from(cashierMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getDashboardSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        createdAt: { gte: todayStart },
      },
      select: { totalAmount: true }
    });

    const monthOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        createdAt: { gte: monthStart },
      },
      select: { totalAmount: true, branchId: true, branch: { select: { name: true } } }
    });

    const totalCustomers = await this.prisma.customer.count();

    const lowStockInventories = await this.prisma.inventory.findMany({
      select: { currentStock: true, minStock: true }
    });
    
    let lowStockAlerts = 0;
    for (const inv of lowStockInventories) {
      if (Number(inv.currentStock) < Number(inv.minStock)) {
        lowStockAlerts++;
      }
    }

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const branchRevMap = new Map<string, number>();
    for (const o of monthOrders) {
      const branchName = o.branch.name;
      const amt = Number(o.totalAmount) || 0;
      branchRevMap.set(branchName, (branchRevMap.get(branchName) || 0) + amt);
    }

    const revenueByBranch = Array.from(branchRevMap.entries()).map(([branchName, revenue]) => ({
      branchName,
      revenue,
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
