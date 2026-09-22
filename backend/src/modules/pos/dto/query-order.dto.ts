import { IsOptional, IsUUID, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by Order Status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by Start Date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by End Date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by Cashier ID' })
  @IsOptional()
  @IsUUID()
  cashierId?: string;

  @ApiPropertyOptional({ description: 'Search by Order Number, Customer Phone or Name' })
  @IsOptional()
  @IsString()
  search?: string;
}
