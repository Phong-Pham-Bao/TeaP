import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { Public } from '../../common/decorators/public.decorator';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import {
  MenuResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('menu')
  @Public()
  @ApiOperation({ summary: 'Get active POS menu grouped by category' })
  @ApiOkResponse({ type: MenuResponseDto })
  getMenu() {
    return this.productsService.getMenu();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CATALOG_READ)
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiPaginatedResponse(ProductResponseDto)
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_READ)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CATALOG_WRITE)
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiOkResponse({ type: ProductResponseDto })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
