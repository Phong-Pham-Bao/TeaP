import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'The name of the branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'The address of the branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({ description: 'The phone number of the branch' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
