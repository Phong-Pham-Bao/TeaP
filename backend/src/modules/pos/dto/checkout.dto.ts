import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment Method (CASH, VNPAY, MOMO, BANK_TRANSFER)' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Amount paid by customer' })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiPropertyOptional({ description: 'Transaction ID for external payment methods' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
