import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CashFlowType } from '@prisma/client';

export class CreateCashFlowDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ enum: CashFlowType, description: 'Type of cash flow' })
  @IsEnum(CashFlowType)
  type: CashFlowType;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  @Min(0)
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
