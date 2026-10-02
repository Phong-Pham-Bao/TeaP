import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionType } from '@prisma/client';
import {
  minVnd,
  percentageOfVnd,
  vnd,
  vndToNumber,
} from '../../common/money/vietnamese-dong';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    if (new Date(createPromotionDto.startDate) > new Date(createPromotionDto.endDate)) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc.');
    }
    return this.prisma.promotion.create({
      data: createPromotionDto,
    });
  }

  async findAll() {
    return this.prisma.promotion.findMany({
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
    if (!promotion) {
      throw new NotFoundException('Khuyến mãi không tồn tại.');
    }
    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    if (updatePromotionDto.startDate && updatePromotionDto.endDate) {
      if (new Date(updatePromotionDto.startDate) > new Date(updatePromotionDto.endDate)) {
        throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc.');
      }
    }
    try {
      return await this.prisma.promotion.update({
        where: { id },
        data: updatePromotionDto,
      });
    } catch (e) {
      throw new NotFoundException('Khuyến mãi không tồn tại.');
    }
  }

  async deactivate(id: string) {
    try {
      return await this.prisma.promotion.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (e) {
      throw new NotFoundException('Khuyến mãi không tồn tại.');
    }
  }

  async validateAndCalculateDiscount(promotionId: string, subtotal: number): Promise<number> {
    const promotion = await this.findOne(promotionId);
    const now = new Date();
    const normalizedSubtotal = vnd(subtotal);

    if (!promotion.isActive || now < promotion.startDate || now > promotion.endDate) {
      throw new BadRequestException('Khuyến mãi không hợp lệ hoặc đã hết hạn.');
    }

    if (promotion.minOrderValue && normalizedSubtotal.lt(promotion.minOrderValue)) {
      throw new BadRequestException(`Đơn hàng phải từ ${promotion.minOrderValue} để áp dụng khuyến mãi này.`);
    }

    let discount = vnd(0);

    switch (promotion.type) {
      case PromotionType.PERCENTAGE:
        discount = percentageOfVnd(normalizedSubtotal, promotion.value);
        if (promotion.maxDiscount && discount.gt(promotion.maxDiscount)) {
          discount = vnd(promotion.maxDiscount);
        }
        break;
      case PromotionType.FIXED_AMOUNT:
        discount = vnd(promotion.value);
        break;
      case PromotionType.BUY_X_GET_Y:
        throw new BadRequestException(
          'BUY_X_GET_Y requires item-level pricing and is not supported by this endpoint.',
        );
    }

    return vndToNumber(minVnd(discount, normalizedSubtotal));
  }
}
