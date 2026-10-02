import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { StockRefType } from '@prisma/client';
import { IsBusinessDate } from '../../../common/validation/is-business-date.decorator';

export class QueryLedgerDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional({ enum: StockRefType })
  @IsOptional()
  @IsEnum(StockRefType)
  refType?: StockRefType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBusinessDate()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBusinessDate()
  endDate?: string;
}
