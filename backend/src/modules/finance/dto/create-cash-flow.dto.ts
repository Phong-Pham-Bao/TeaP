import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { CashFlowType } from '@prisma/client';
import { VND_MAX_AMOUNT } from '../../../common/money/vietnamese-dong';

export class CreateCashFlowDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ enum: CashFlowType, description: 'Type of cash flow' })
  @IsEnum(CashFlowType)
  type: CashFlowType;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: VND_MAX_AMOUNT,
    description: 'Amount in whole VND',
    example: 50000,
  })
  @IsInt()
  @Min(1)
  @Max(VND_MAX_AMOUNT)
  amount: number;

  @ApiProperty({ description: 'Description of the cash flow' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Reference Type (e.g. ORDER, SALARY)' })
  @IsOptional()
  @IsString()
  refType?: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsOptional()
  @IsString()
  refId?: string;
}
