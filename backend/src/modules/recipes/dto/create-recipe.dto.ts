import { IsUUID, IsArray, ValidateNested, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeItemDto {
  @ApiProperty({ description: 'ID of the material product' })
  @IsUUID()
  materialId: string;

  @ApiPropertyOptional({ description: 'ID of the product size (if specific to a size)' })
  @IsOptional()
  @IsUUID()
  sizeId?: string;

  @ApiProperty({ description: 'Quantity of the material used' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement (e.g., ml, g, pcs)' })
  @IsString()
  unit: string;
}

export class CreateRecipeDto {
  @ApiProperty({ description: 'ID of the drink product' })
  @IsUUID()
  drinkId: string;

  @ApiProperty({ type: [RecipeItemDto], description: 'List of recipe items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
