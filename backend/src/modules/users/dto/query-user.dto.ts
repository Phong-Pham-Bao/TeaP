import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Search by full name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
