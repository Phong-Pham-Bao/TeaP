import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { normalizeVietnamesePhone } from '../../common/transforms/normalize-phone';
import { paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const phone = normalizeVietnamesePhone(createCustomerDto.phone) as string;
    const existing = await this.prisma.customer.findUnique({
      where: { phone },
    });
    if (existing) {
      throw new ConflictException('Số điện thoại đã được đăng ký.');
    }
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        phone,
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

  async findAll(query: QueryCustomerDto) {
    const { skip, take, search } = query;
    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
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

    return paginate(data, total, query.page ?? 1, query.limit ?? 20);
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
    const normalizedPhone = normalizeVietnamesePhone(phone) as string;
    const customer = await this.prisma.customer.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        phone: true,
        fullName: true,
        totalPoints: true,
      },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng với số điện thoại này.');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const phone = updateCustomerDto.phone
      ? normalizeVietnamesePhone(updateCustomerDto.phone) as string
      : undefined;
    if (phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { phone, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Số điện thoại đã được đăng ký bởi khách hàng khác.');
      }
    }
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: { ...updateCustomerDto, phone },
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

    return paginate(data, total, query.page ?? 1, query.limit ?? 20);
  }
}
