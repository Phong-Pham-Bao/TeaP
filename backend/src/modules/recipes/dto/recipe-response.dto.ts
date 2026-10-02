import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import {
  DecimalQuantityInput,
  decimalQuantityToString,
} from '../../../common/quantity/decimal-quantity';

export class RecipeMaterialResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ProductType }) type: ProductType;
}

export class RecipeSizeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class RecipeItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() drinkId: string;
  @ApiProperty() materialId: string;
  @ApiPropertyOptional({ type: String, nullable: true }) sizeId?: string | null;
  @ApiProperty({
    type: 'string',
    example: '25.5',
    pattern: '^-?\\d+(?:\\.\\d+)?$',
    description: 'Exact decimal quantity; parse explicitly when calculating',
  })
  quantity: string;
  @ApiProperty() unit: string;
  @ApiPropertyOptional({ type: RecipeMaterialResponseDto })
  material?: RecipeMaterialResponseDto;
  @ApiPropertyOptional({ type: RecipeSizeResponseDto, nullable: true })
  size?: RecipeSizeResponseDto | null;
}

type RecipeItemQuantityShape = { quantity: DecimalQuantityInput };

export function toRecipeItemResponse<T extends RecipeItemQuantityShape>(item: T) {
  return { ...item, quantity: decimalQuantityToString(item.quantity) };
}
