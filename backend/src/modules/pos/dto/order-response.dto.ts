import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus, ProductType } from '@prisma/client';
import { MoneyInput, vndToNumber } from '../../../common/money/vietnamese-dong';

export class OrderProductReferenceDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ProductType }) type: ProductType;
  @ApiPropertyOptional({ type: 'integer', description: 'Whole VND' }) basePrice?: number;
  @ApiPropertyOptional({ type: String, nullable: true }) categoryId?: string | null;
}

export class OrderSizeReferenceDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ type: 'integer', description: 'Whole VND' }) priceAdj?: number;
}

export class OrderCustomerReferenceDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() fullName: string;
  @ApiProperty() phone: string;
}

export class OrderCashierReferenceDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() fullName: string;
}

export class OrderItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiPropertyOptional({ type: String, nullable: true }) sizeId?: string | null;
  @ApiProperty() qty: number;
  @ApiProperty({ description: 'Whole VND', example: 45000 }) unitPrice: number;
  @ApiProperty({ description: 'Whole VND', example: 90000 }) subtotal: number;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  attributes?: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: OrderProductReferenceDto })
  product?: OrderProductReferenceDto;
  @ApiPropertyOptional({ type: OrderSizeReferenceDto, nullable: true })
  size?: OrderSizeReferenceDto | null;
}

export class PaymentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderId: string;
  @ApiProperty({ enum: PaymentMethod }) method: PaymentMethod;
  @ApiProperty({ description: 'Whole VND', example: 90000 }) amount: number;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiPropertyOptional({ type: String, nullable: true })
  transactionId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  paidAt?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
}

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderNumber: string;
  @ApiProperty() branchId: string;
  @ApiProperty() cashierId: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  customerId?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  promotionId?: string | null;
  @ApiProperty({ description: 'Whole VND', example: 100000 }) subtotal: number;
  @ApiProperty({ description: 'Whole VND', example: 10000 }) discount: number;
  @ApiProperty({ description: 'Whole VND', example: 90000 }) totalAmount: number;
  @ApiProperty() pointsEarned: number;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiPropertyOptional({ type: String, nullable: true }) note?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiProperty({ type: [OrderItemResponseDto] }) items: OrderItemResponseDto[];
  @ApiPropertyOptional({ type: [PaymentResponseDto] })
  payments?: PaymentResponseDto[];
  @ApiPropertyOptional({ type: OrderCustomerReferenceDto, nullable: true })
  customer?: OrderCustomerReferenceDto | null;
  @ApiPropertyOptional({ type: OrderCashierReferenceDto })
  cashier?: OrderCashierReferenceDto;
}

type OrderItemMoneyShape = {
  unitPrice: MoneyInput;
  subtotal: MoneyInput;
  product?: object;
  size?: object | null;
};

type PaymentMoneyShape = {
  amount: MoneyInput;
};

type OrderMoneyShape = {
  subtotal: MoneyInput;
  discount: MoneyInput;
  totalAmount: MoneyInput;
  items: OrderItemMoneyShape[];
  payments?: PaymentMoneyShape[];
};

export function toOrderResponse<T extends OrderMoneyShape>(order: T) {
  return {
    ...order,
    subtotal: vndToNumber(order.subtotal),
    discount: vndToNumber(order.discount),
    totalAmount: vndToNumber(order.totalAmount),
    items: order.items.map((item) => {
      const product = item.product as ({ basePrice?: MoneyInput } & object) | undefined;
      const size = item.size as ({ priceAdj?: MoneyInput } & object) | null | undefined;
      return {
        ...item,
        unitPrice: vndToNumber(item.unitPrice),
        subtotal: vndToNumber(item.subtotal),
        product: product
          ? {
              ...product,
              basePrice:
                product.basePrice === undefined
                  ? undefined
                  : vndToNumber(product.basePrice),
            }
          : undefined,
        size: size
          ? {
              ...size,
              priceAdj:
                size.priceAdj === undefined
                  ? undefined
                  : vndToNumber(size.priceAdj),
            }
          : size,
      };
    }),
    payments: order.payments?.map((payment) => ({
      ...payment,
      amount: vndToNumber(payment.amount),
    })),
  };
}
