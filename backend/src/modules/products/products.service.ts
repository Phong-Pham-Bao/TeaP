import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { sizes, ...productData } = createProductDto;

    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: productData.sku },
    });
    if (existingProduct) {
      throw new BadRequestException('Product SKU already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          sizes: sizes?.length
            ? {
                create: sizes.map((size) => ({
                  name: size.name,
                  priceAdj: size.priceAdjustment,
                })),
              }
            : undefined,
        },
        include: { sizes: true },
      });
      return product;
    });
  }

  async findAll(query: QueryProductDto) {
    const { skip, take, type, categoryId, search, isActive } = query;

    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: { category: true, sizes: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: true,
        recipeItems: {
          include: {
            material: true,
            size: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getMenu() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: {
            isActive: true,
            type: { in: ['DRINK', 'TOPPING'] },
          },
          include: { sizes: true, category: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const drinks: any[] = [];
    const toppings: any[] = [];

    categories.forEach((cat) => {
      cat.products.forEach((prod) => {
        if (prod.type === 'TOPPING') {
          toppings.push(prod);
        } else {
          drinks.push(prod);
        }
      });
    });

    return {
      drinks,
      toppings,
      categories,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { sizes, ...productData } = updateProductDto;

    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (productData.sku && productData.sku !== existing.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { sku: productData.sku },
      });
      if (skuExists) {
        throw new BadRequestException('Product SKU already exists');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (sizes) {
        await tx.productSize.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          sizes: sizes?.length
            ? {
                create: sizes.map((size) => ({
                  name: size.name,
                  priceAdj: size.priceAdjustment,
                })),
              }
            : undefined,
        },
        include: { sizes: true },
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
