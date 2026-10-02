import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashFlowType } from '@prisma/client';
import { MoneyInput, vndToNumber } from '../../../common/money/vietnamese-dong';

export class CashFlowBranchResponseDto {
  @ApiProperty() name: string;
}

export class CashFlowResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() branchId: string;
  @ApiProperty({ enum: CashFlowType }) type: CashFlowType;
  @ApiProperty({ type: 'integer', description: 'Whole VND', example: 150000 })
  amount: number;
  @ApiProperty() description: string;
  @ApiPropertyOptional({ type: String, nullable: true }) refType?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) refId?: string | null;
  @ApiProperty() createdBy: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiPropertyOptional({ type: CashFlowBranchResponseDto }) branch?: CashFlowBranchResponseDto;
}

export class CashFlowDateSummaryDto {
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) income: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) expense: number;
}

export class CashFlowSummaryResponseDto {
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) totalIncome: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) totalExpense: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) netCashFlow: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/CashFlowDateSummaryDto' },
  })
  groupedByDate: Record<string, CashFlowDateSummaryDto>;
}

export function toCashFlowResponse<T extends { amount: MoneyInput }>(cashFlow: T) {
  return { ...cashFlow, amount: vndToNumber(cashFlow.amount) };
}
