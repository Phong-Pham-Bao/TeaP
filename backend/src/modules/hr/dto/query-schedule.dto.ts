import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBusinessDate } from '../../../common/validation/is-business-date.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryScheduleDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBusinessDate()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBusinessDate()
  endDate?: string;
}
