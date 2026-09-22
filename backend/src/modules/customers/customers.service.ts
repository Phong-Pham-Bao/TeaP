import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: createCustomerDto.phone },
    });
    if (existing) {
      throw new ConflictException('Số điện thoại đã được đăng ký.');
    }
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        totalPoints: 10,
        pointTransactions: {
          create: {
            points: 10,
            reason: 'Tặng 10 điểm chào mừng hội viên mới TeaP',
          },
        },
      },
    });
  }

  async redeemPoints(customerId: string, points: number, rewardTitle: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Khách hàng không tồn tại.');
    if (customer.totalPoints < points) {
      throw new ConflictException(`Bạn cần ít nhất ${points} điểm để đổi ưu đãi này (hiện có: ${customer.totalPoints} điểm).`);
    }

    const voucherCode = `TEAP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { totalPoints: { decrement: points } },
      });

      await tx.pointTransaction.create({
        data: {
          customerId,
          points: -points,
          reason: `Đổi ưu đãi: ${rewardTitle} [Mã voucher: ${voucherCode}]`,
        },
      });

      return tx.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              items: {
                include: { product: true, size: true },
              },
              branch: true,
            },
          },
          pointTransactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return {
      success: true,
      voucherCode,
      message: `Đổi thành công! Mã voucher của bạn là ${voucherCode}`,
      customer: updated,
    };
  }

  async findAll(query: QueryCustomerDto) {
    const { skip, take, search } = query;
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as any } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại.');
    }
    return customer;
  }

  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true,
                size: true,
              },
            },
            branch: true,
          },
        },
        pointTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng với số điện thoại này.');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    if (updateCustomerDto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { phone: updateCustomerDto.phone, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Số điện thoại đã được đăng ký bởi khách hàng khác.');
      }
    }
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: updateCustomerDto,
      });
    } catch (e) {
      throw new NotFoundException('Khách hàng không tồn tại.');
    }
  }

  async getPointHistory(customerId: string, query: QueryCustomerDto) {
    const { skip, take } = query;
    
    // Check if customer exists
    await this.findOne(customerId);

    const [data, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { customerId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pointTransaction.count({ where: { customerId } }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }
}
