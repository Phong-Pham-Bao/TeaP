import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { MoneyInput, vndToNumber } from '../../../common/money/vietnamese-dong';

export class CategoryReferenceDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class ProductSizeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: 'integer', description: 'Whole VND', example: 5000 })
  priceAdj: number;
}

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ProductType }) type: ProductType;
  @ApiProperty({ type: 'integer', description: 'Whole VND', example: 45000 })
  basePrice: number;
  @ApiPropertyOptional({ type: String, nullable: true }) image?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) categoryId?: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: CategoryReferenceDto, nullable: true })
  category?: CategoryReferenceDto | null;
  @ApiPropertyOptional({ type: [ProductSizeResponseDto] })
  sizes?: ProductSizeResponseDto[];
}

export class MenuCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description?: string | null;
  @ApiProperty() sortOrder: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [ProductResponseDto] }) products: ProductResponseDto[];
}

export class MenuResponseDto {
  @ApiProperty({ type: [ProductResponseDto] }) drinks: ProductResponseDto[];
  @ApiProperty({ type: [ProductResponseDto] }) toppings: ProductResponseDto[];
  @ApiProperty({ type: [MenuCategoryResponseDto] }) categories: MenuCategoryResponseDto[];
}

type ProductMoneyShape = {
  basePrice: MoneyInput;
  sizes?: Array<{ priceAdj: MoneyInput }>;
};

export function toProductResponse<T extends ProductMoneyShape>(product: T) {
  return {
    ...product,
    basePrice: vndToNumber(product.basePrice),
    sizes: product.sizes?.map((size) => ({
      ...size,
      priceAdj: vndToNumber(size.priceAdj),
    })),
  };
}

type MenuShape<TProduct extends ProductMoneyShape> = {
  drinks: TProduct[];
  toppings: TProduct[];
  categories: Array<Record<string, unknown> & { products: TProduct[] }>;
};

export function toMenuResponse<TProduct extends ProductMoneyShape>(menu: MenuShape<TProduct>) {
  return {
    drinks: menu.drinks.map(toProductResponse),
    toppings: menu.toppings.map(toProductResponse),
    categories: menu.categories.map((category) => ({
      ...category,
      products: category.products.map(toProductResponse),
    })),
  };
}
