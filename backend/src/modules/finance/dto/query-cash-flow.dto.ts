import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CashFlowType } from '@prisma/client';

export class QueryCashFlowDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: CashFlowType, description: 'Filter by CashFlowType' })
  @IsOptional()
  @IsEnum(CashFlowType)
  type?: CashFlowType;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
