import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBusinessDate } from '../../../common/validation/is-business-date.decorator';

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

  @ApiPropertyOptional({ description: 'Start business date (YYYY-MM-DD)' })
  @IsOptional()
  @IsBusinessDate()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End business date, inclusive (YYYY-MM-DD)' })
  @IsOptional()
  @IsBusinessDate()
  endDate?: string;

  @ApiPropertyOptional({ enum: GroupByTime, default: GroupByTime.DAY })
  @IsOptional()
  @IsEnum(GroupByTime)
  groupBy?: GroupByTime;
}
