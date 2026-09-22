import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsUUID()
  materialId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  newStock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
