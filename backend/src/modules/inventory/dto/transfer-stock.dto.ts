import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferStockDto {
  @ApiProperty()
  @IsUUID()
  fromBranchId: string;

  @ApiProperty()
  @IsUUID()
  toBranchId: string;

  @ApiProperty()
  @IsUUID()
  materialId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
