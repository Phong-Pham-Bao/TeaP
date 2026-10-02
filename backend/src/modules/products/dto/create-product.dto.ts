import { IsString, IsEnum, IsInt, IsOptional, IsUUID, IsArray, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { VND_MAX_AMOUNT } from '../../../common/money/vietnamese-dong';

export class ProductSizeDto {
  @ApiProperty({ description: 'Size name, e.g., S, M, L' })
  @IsString()
  name: string;

  @ApiProperty({
    type: 'integer',
    minimum: -VND_MAX_AMOUNT,
    maximum: VND_MAX_AMOUNT,
    description: 'Price adjustment in whole VND',
  })
  @IsInt()
  @Min(-VND_MAX_AMOUNT)
  @Max(VND_MAX_AMOUNT)
  priceAdjustment: number;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Unique SKU for the product' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ProductType, description: 'Type of product' })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    maximum: VND_MAX_AMOUNT,
    description: 'Base price in whole VND',
    example: 45000,
  })
  @IsInt()
  @Min(0)
  @Max(VND_MAX_AMOUNT)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: [ProductSizeDto], description: 'Product sizes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSizeDto)
  sizes?: ProductSizeDto[];
}
