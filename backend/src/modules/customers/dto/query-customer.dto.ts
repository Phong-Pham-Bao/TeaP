import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCustomerDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by full name or phone number' })
  @IsOptional()
  @IsString()
  search?: string;
}
