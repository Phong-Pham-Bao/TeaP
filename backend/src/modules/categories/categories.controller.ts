import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CATALOG_READ)
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_READ)
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({ type: CategoryResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Soft delete a category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
