import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class ProductSizeDto {
  @ApiProperty({ description: 'Size name, e.g., S, M, L' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price adjustment for this size' })
  @IsNumber()
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

  @ApiProperty({ description: 'Base price of the product' })
  @IsNumber()
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
