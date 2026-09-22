import { IsUUID, IsNumber, Min, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportStockItemDto {
  @ApiProperty()
  @IsUUID()
  materialId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty()
  @IsString()
  unit: string;
}

export class ImportStockDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ type: [ImportStockItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStockItemDto)
  items: ImportStockItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
