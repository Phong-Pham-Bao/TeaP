import { IsUUID, IsInt, Min, Max, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalarySlipDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsNumber()
  baseSalary: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bonus?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deduction?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
