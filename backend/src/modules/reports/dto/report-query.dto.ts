import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GroupByTime {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: GroupByTime, default: GroupByTime.DAY })
  @IsOptional()
  @IsEnum(GroupByTime)
  groupBy?: GroupByTime;
}
