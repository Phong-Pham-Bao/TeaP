import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🍰 Bổ sung sản phẩm Bánh ngọt & Topping mới...');

  // 1. Tìm hoặc tạo danh mục Bánh Ngọt
  let cakeCategory = await prisma.category.findFirst({
    where: { name: 'Bánh Ngọt & Tráng Miệng' }
  });

  if (!cakeCategory) {
    cakeCategory = await prisma.category.create({
      data: {
        name: 'Bánh Ngọt & Tráng Miệng',
        description: 'Bánh ngọt, bánh mì nướng và tráng miệng ăn kèm trà sữa',
        sortOrder: 6,
        isActive: true,
      }
    });
  }

  // 2. Thêm các món Bánh ngọt
  const cakes = [
    { sku: 'CAKE-001', name: 'Bánh Mousse Phô Mai Việt Quất', basePrice: 38000, categoryId: cakeCategory.id },
    { sku: 'CAKE-002', name: 'Bánh Tiramisu Truyền Thống', basePrice: 42000, categoryId: cakeCategory.id },
    { sku: 'CAKE-003', name: 'Bánh Croissant Bơ Tươi', basePrice: 28000, categoryId: cakeCategory.id },
    { sku: 'CAKE-004', name: 'Bánh Su Kem Phô Mai (Hộp 4 cái)', basePrice: 35000, categoryId: cakeCategory.id },
    { sku: 'CAKE-005', name: 'Bánh Trứng Tart Bồ Đào Nha', basePrice: 25000, categoryId: cakeCategory.id },
    { sku: 'CAKE-006', name: 'Bánh Red Velvet Trái Tim', basePrice: 45000, categoryId: cakeCategory.id },
  ];

  for (const cake of cakes) {
    await prisma.product.upsert({
      where: { sku: cake.sku },
      update: { basePrice: cake.basePrice, categoryId: cake.categoryId },
      create: {
        sku: cake.sku,
        name: cake.name,
        type: ProductType.DRINK, // Cho phép bán tại menu POS
        basePrice: cake.basePrice,
        categoryId: cake.categoryId,
        isActive: true,
      }
    });
  }

  // 3. Thêm Topping mới
  let toppingCategory = await prisma.category.findFirst({
    where: { name: 'Topping' }
  });

  const newToppings = [
    { sku: 'TP-009', name: 'Trân Châu Hoàng Kim', basePrice: 10000 },
    { sku: 'TP-010', name: 'Khúc Bạch Phô Mai', basePrice: 12000 },
    { sku: 'TP-011', name: 'Hạt Sen Tươi Rim Đường', basePrice: 10000 },
    { sku: 'TP-012', name: 'Thạch Củ Năng Giòn', basePrice: 8000 },
  ];

  for (const top of newToppings) {
    await prisma.product.upsert({
      where: { sku: top.sku },
      update: { basePrice: top.basePrice },
      create: {
        sku: top.sku,
        name: top.name,
        type: ProductType.TOPPING,
        basePrice: top.basePrice,
        categoryId: toppingCategory ? toppingCategory.id : undefined,
        isActive: true,
      }
    });
  }

  // 4. Thêm Đồ uống mùa hè mới
  let teaCategory = await prisma.category.findFirst({
    where: { name: 'Trà Sữa' }
  });

  const newDrinks = [
    { 
      sku: 'TS-006', 
      name: 'Trà Sữa Nướng Caramel Muối Biển', 
      basePrice: 52000, 
      categoryId: teaCategory?.id,
      sizes: [{ name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 }]
    },
    { 
      sku: 'TS-007', 
      name: 'Trà Sữa Lài Hoa Cúc (Jasmine)', 
      basePrice: 46000, 
      categoryId: teaCategory?.id,
      sizes: [{ name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 }]
    }
  ];

  for (const dr of newDrinks) {
    const p = await prisma.product.upsert({
      where: { sku: dr.sku },
      update: { basePrice: dr.basePrice },
      create: {
        sku: dr.sku,
        name: dr.name,
        type: ProductType.DRINK,
        basePrice: dr.basePrice,
        categoryId: dr.categoryId,
        isActive: true,
        sizes: {
          create: dr.sizes
        }
      }
    });
  }

  console.log('✅ Đã bổ sung thành công 6 loại Bánh ngọt, 4 loại Topping mới, và 2 loại Trà sữa mới!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
