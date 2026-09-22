import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Recipes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get(':drinkId')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.WAREHOUSE_STAFF)
  @ApiOperation({ summary: 'Get recipe for a specific drink' })
  getRecipe(@Param('drinkId') drinkId: string) {
    return this.recipesService.getRecipe(drinkId);
  }

  @Put(':drinkId')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Set or update recipe for a specific drink' })
  setRecipe(
    @Param('drinkId') drinkId: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    // Ensure the drinkId in param matches the DTO
    if (updateRecipeDto.drinkId !== drinkId) {
      updateRecipeDto.drinkId = drinkId;
    }
    return this.recipesService.setRecipe(updateRecipeDto);
  }
}
