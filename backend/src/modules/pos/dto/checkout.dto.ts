import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VND_MAX_AMOUNT } from '../../../common/money/vietnamese-dong';

export class CheckoutDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment Method (CASH, VNPAY, MOMO, BANK_TRANSFER)' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    maximum: VND_MAX_AMOUNT,
    description: 'Amount paid by customer in whole VND',
    example: 100000,
  })
  @IsInt()
  @Min(0)
  @Max(VND_MAX_AMOUNT)
  amountPaid: number;

  @ApiPropertyOptional({ description: 'Transaction ID for external payment methods' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
