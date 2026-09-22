import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { ProductType } from '@prisma/client';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecipe(drinkId: string) {
    const drink = await this.prisma.product.findUnique({
      where: { id: drinkId },
    });

    if (!drink) {
      throw new NotFoundException(`Drink with ID ${drinkId} not found`);
    }

    return this.prisma.recipeItem.findMany({
      where: { drinkId },
      include: {
        material: true,
        size: true,
      },
    });
  }

  async setRecipe(updateRecipeDto: UpdateRecipeDto) {
    const { drinkId, items } = updateRecipeDto;

    // Validate drink
    const drink = await this.prisma.product.findUnique({
      where: { id: drinkId },
    });
    if (!drink || drink.type !== ProductType.DRINK) {
      throw new BadRequestException('Invalid drink ID or product is not a DRINK');
    }

    // Validate materials
    const materialIds = items.map((item) => item.materialId);
    const materials = await this.prisma.product.findMany({
      where: {
        id: { in: materialIds },
        type: ProductType.MATERIAL,
      },
    });

    if (materials.length !== new Set(materialIds).size) {
      throw new BadRequestException('One or more material IDs are invalid or not of type MATERIAL');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete existing recipe items for this drink
      await tx.recipeItem.deleteMany({
        where: { drinkId },
      });

      // Insert new recipe items
      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((item) => ({
            drinkId,
            materialId: item.materialId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });
      }

      return tx.recipeItem.findMany({
        where: { drinkId },
        include: {
          material: true,
          size: true,
        },
      });
    });
  }

  async getRecipeForOrder(drinkId: string, sizeId?: string) {
    const where: any = { drinkId };
    
    // If size is provided, we should match recipe items for that specific size
    // OR items that have no specific size (apply to all sizes)
    if (sizeId) {
      where.OR = [
        { sizeId: sizeId },
        { sizeId: null }
      ];
    } else {
      where.sizeId = null;
    }

    return this.prisma.recipeItem.findMany({
      where,
      include: {
        material: true,
      },
    });
  }
}
