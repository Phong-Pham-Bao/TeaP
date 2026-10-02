import { IsUUID, IsInt, Min, IsOptional, ValidateNested, IsArray, IsObject, Max, IsString, MaxLength, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AttributesDto {
  @ApiPropertyOptional({ description: 'Ice percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  ice?: number;

  @ApiPropertyOptional({ description: 'Sugar percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sugar?: number;

  @ApiPropertyOptional({ description: 'Topping product IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  toppings?: string[];

  @ApiPropertyOptional({ description: 'Preparation note for this item' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID (must be a drink/product)' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Size ID' })
  @IsOptional()
  @IsUUID()
  sizeId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiPropertyOptional({ description: 'Attributes like ice, sugar, toppings', type: AttributesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AttributesDto)
  attributes?: AttributesDto;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Promotion ID' })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Note for the order' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
