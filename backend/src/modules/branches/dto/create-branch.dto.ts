import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'The name of the branch' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The address of the branch' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'The phone number of the branch' })
  @IsOptional()
  @IsString()
  phone?: string;
}
