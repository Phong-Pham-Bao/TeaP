import {
  Prisma,
  PrismaClient,
  Role,
  ProductType,
  PromotionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type CategorySeed = {
  name: string;
  description?: string;
  sortOrder: number;
};

type ProductSeed = {
  sku: string;
  name: string;
  type: ProductType;
  basePrice: Prisma.Decimal | Prisma.DecimalJsLike | number | string;
  categoryId?: string;
  sizes?: {
    create: Array<{
      name: string;
      priceAdj: Prisma.Decimal | Prisma.DecimalJsLike | number | string;
    }>;
  };
};

function assertSafeSeedTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to load demo seed while NODE_ENV=production');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for seeding');

  const parsed = new URL(databaseUrl);
  const allowedHosts = new Set(['localhost', '127.0.0.1', 'postgres']);
  if (
    !allowedHosts.has(parsed.hostname.toLowerCase()) &&
    process.env.ALLOW_REMOTE_DEMO_SEED !== 'true'
  ) {
    throw new Error(
      `Refusing demo seed on remote host "${parsed.hostname}". ` +
        'Set ALLOW_REMOTE_DEMO_SEED=true only for an approved non-production environment.',
    );
  }
}

async function ensureUser(input: { data: Prisma.UserUncheckedCreateInput }) {
  const email = input.data.email.trim().toLowerCase();
  return prisma.user.upsert({
    where: { email },
    create: { ...input.data, email },
    update: { ...input.data, email },
  });
}

async function ensureCategory(input: { data: CategorySeed }) {
  const matches = await prisma.category.findMany({
    where: { name: { equals: input.data.name, mode: 'insensitive' } },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  if (matches.length > 1) {
    throw new Error(`Duplicate category name requires review: ${input.data.name}`);
  }
  if (matches[0]) {
    return prisma.category.update({
      where: { id: matches[0].id },
      data: { ...input.data, isActive: true },
    });
  }
  return prisma.category.create({ data: input.data });
}

async function ensureProduct(input: { data: ProductSeed; include?: unknown }) {
  const { sizes, ...data } = input.data;
  const product = await prisma.product.upsert({
    where: { sku: data.sku },
    create: { ...data, sizes },
    update: { ...data, isActive: true },
  });

  for (const size of sizes?.create ?? []) {
    await prisma.productSize.upsert({
      where: { productId_name: { productId: product.id, name: size.name } },
      create: { productId: product.id, ...size },
      update: { priceAdj: size.priceAdj },
    });
  }

  return prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    include: { sizes: true },
  });
}

async function ensureRecipes(input: {
  data: Prisma.RecipeItemUncheckedCreateInput[];
}) {
  for (const item of input.data) {
    if (!item.sizeId) {
      throw new Error('Seed recipes must use an explicit product size');
    }
    await prisma.recipeItem.upsert({
      where: {
        drinkId_materialId_sizeId: {
          drinkId: item.drinkId,
          materialId: item.materialId,
          sizeId: item.sizeId,
        },
      },
      create: item,
      update: { quantity: item.quantity, unit: item.unit },
    });
  }
}

async function ensurePromotion(data: Prisma.PromotionUncheckedCreateInput) {
  const matches = await prisma.promotion.findMany({
    where: { name: data.name },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  if (matches.length > 1) {
    throw new Error(`Duplicate promotion name requires review: ${data.name}`);
  }
  return matches[0]
    ? prisma.promotion.update({ where: { id: matches[0].id }, data })
    : prisma.promotion.create({ data });
}

async function ensureAnnouncement(
  data: Prisma.AnnouncementUncheckedCreateInput,
) {
  const matches = await prisma.announcement.findMany({
    where: { title: data.title, authorId: data.authorId },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  if (matches.length > 1) {
    throw new Error(`Duplicate announcement requires review: ${data.title}`);
  }
  return matches[0]
    ? prisma.announcement.update({ where: { id: matches[0].id }, data })
    : prisma.announcement.create({ data });
}

async function main() {
  assertSafeSeedTarget();
  // Session-scoped lock prevents concurrent seed processes from racing upserts.
  // PostgreSQL releases it automatically when Prisma disconnects.
  const [seedLock] = await prisma.$queryRaw<Array<{ acquired: boolean }>>`
    SELECT pg_try_advisory_lock(hashtext('teap_demo_seed')) AS acquired
  `;
  if (!seedLock?.acquired) {
    throw new Error('Another TeaP seed process is already running');
  }
  console.log('🌱 Starting seed...');

  // ============================================================
  // 1. BRANCHES (5 chi nhánh)
  // ============================================================
  const branchSeeds = [
    { name: 'TeaP Quận 1', address: '123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM', phone: '028-1234-5001' },
    { name: 'TeaP Quận 3', address: '456 Võ Văn Tần, P.5, Q.3, TP.HCM', phone: '028-1234-5003' },
    { name: 'TeaP Quận 7', address: '789 Nguyễn Thị Thập, P. Tân Phú, Q.7, TP.HCM', phone: '028-1234-5007' },
    { name: 'TeaP Thủ Đức', address: '321 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức', phone: '028-1234-5009' },
    { name: 'TeaP Bình Thạnh', address: '654 Xô Viết Nghệ Tĩnh, P.25, Q. Bình Thạnh', phone: '028-1234-5010' },
  ];
  const branches = [];
  for (const branchData of branchSeeds) {
    const existing = await prisma.branch.findFirst({
      where: { name: { equals: branchData.name, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
    });
    branches.push(
      existing
        ? await prisma.branch.update({
            where: { id: existing.id },
            data: { ...branchData, isActive: true },
          })
        : await prisma.branch.create({ data: branchData }),
    );
  }
  console.log(`✅ Ensured ${branches.length} branches`);

  // ============================================================
  // 2. USERS (1 per role + extra cashiers)
  // ============================================================
  const hashedPasswords = {
    admin: await bcrypt.hash('Admin@123', 10),
    manager: await bcrypt.hash('Manager@123', 10),
    cashier: await bcrypt.hash('Cashier@123', 10),
    warehouse: await bcrypt.hash('Warehouse@123', 10),
    accountant: await bcrypt.hash('Accountant@123', 10),
    hr: await bcrypt.hash('Hr@123', 10),
    kitchen: await bcrypt.hash('Kitchen@123', 10),
  };

  const users = await Promise.all([
    // Super Admin (no branch)
    ensureUser({
      data: {
        email: 'admin@teap.vn', password: hashedPasswords.admin,
        fullName: 'Nguyễn Văn Admin', phone: '0901000001', role: Role.SUPER_ADMIN,
      },
    }),
    // Managers (1 per branch)
    ensureUser({
      data: {
        email: 'manager.q1@teap.vn', password: hashedPasswords.manager,
        fullName: 'Trần Thị Quản Lý', phone: '0901000002', role: Role.MANAGER,
        branchId: branches[0].id,
      },
    }),
    ensureUser({
      data: {
        email: 'manager@teap.vn', password: hashedPasswords.manager,
        fullName: 'Lê Văn Manager', phone: '0901000010', role: Role.MANAGER,
        branchId: branches[1].id,
      },
    }),
    // Cashiers (4 for branch 1: 2 morning, 2 evening)
    ensureUser({
      data: {
        email: 'cashier@teap.vn', password: hashedPasswords.cashier,
        fullName: 'Phạm Minh Thu Ngân', phone: '0901000003', role: Role.CASHIER,
        branchId: branches[0].id,
      },
    }),
    ensureUser({
      data: {
        email: 'cashier2@teap.vn', password: hashedPasswords.cashier,
        fullName: 'Ngô Thanh Hương', phone: '0901000004', role: Role.CASHIER,
        branchId: branches[0].id,
      },
    }),
    ensureUser({
      data: {
        email: 'cashier3@teap.vn', password: hashedPasswords.cashier,
        fullName: 'Đặng Văn Tùng', phone: '0901000005', role: Role.CASHIER,
        branchId: branches[0].id,
      },
    }),
    ensureUser({
      data: {
        email: 'cashier4@teap.vn', password: hashedPasswords.cashier,
        fullName: 'Bùi Thị Mai', phone: '0901000006', role: Role.CASHIER,
        branchId: branches[0].id,
      },
    }),
    // Warehouse Staff
    ensureUser({
      data: {
        email: 'warehouse@teap.vn', password: hashedPasswords.warehouse,
        fullName: 'Hoàng Văn Kho', phone: '0901000007', role: Role.WAREHOUSE_STAFF,
        branchId: branches[0].id,
      },
    }),
    // Accountant
    ensureUser({
      data: {
        email: 'accountant@teap.vn', password: hashedPasswords.accountant,
        fullName: 'Vũ Thị Kế Toán', phone: '0901000008', role: Role.ACCOUNTANT,
      },
    }),
    // HR
    ensureUser({
      data: {
        email: 'hr@teap.vn', password: hashedPasswords.hr,
        fullName: 'Lý Văn Nhân Sự', phone: '0901000009', role: Role.HR,
      },
    }),
    // Kitchen display / bar staff
    ensureUser({
      data: {
        email: 'kitchen@teap.vn', password: hashedPasswords.kitchen,
        fullName: 'Đỗ Minh Pha Chế', phone: '0901000011', role: Role.KITCHEN_STAFF,
        branchId: branches[0].id,
      },
    }),
  ]);

  for (const user of users) {
    if (!user.branchId) continue;
    await prisma.userBranchAssignment.upsert({
      where: {
        userId_branchId: { userId: user.id, branchId: user.branchId },
      },
      create: {
        userId: user.id,
        branchId: user.branchId,
        isPrimary: true,
      },
      update: { isPrimary: true },
    });
  }
  console.log(`✅ Created ${users.length} users`);

  // ============================================================
  // 3. CATEGORIES
  // ============================================================
  const categories = await Promise.all([
    ensureCategory({ data: { name: 'Trà Sữa', description: 'Các loại trà sữa truyền thống và đặc biệt', sortOrder: 1 } }),
    ensureCategory({ data: { name: 'Trà Trái Cây', description: 'Trà tươi kết hợp trái cây tự nhiên', sortOrder: 2 } }),
    ensureCategory({ data: { name: 'Cà Phê', description: 'Các loại cà phê pha máy và pha phin', sortOrder: 3 } }),
    ensureCategory({ data: { name: 'Đá Xay', description: 'Đồ uống đá xay mát lạnh', sortOrder: 4 } }),
    ensureCategory({ data: { name: 'Topping', description: 'Topping thêm vào đồ uống', sortOrder: 5 } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // ============================================================
  // 4. PRODUCTS — Drinks
  // ============================================================
  const drinks = await Promise.all([
    // Trà Sữa
    ensureProduct({
      data: {
        sku: 'TS-001', name: 'Trà Sữa Trân Châu Đường Đen', type: ProductType.DRINK,
        basePrice: 45000, categoryId: categories[0].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TS-002', name: 'Trà Sữa Matcha', type: ProductType.DRINK,
        basePrice: 50000, categoryId: categories[0].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TS-003', name: 'Trà Sữa Taro', type: ProductType.DRINK,
        basePrice: 48000, categoryId: categories[0].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TS-004', name: 'Trà Sữa Oolong', type: ProductType.DRINK,
        basePrice: 42000, categoryId: categories[0].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TS-005', name: 'Trà Sữa Hokkaido', type: ProductType.DRINK,
        basePrice: 55000, categoryId: categories[0].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),

    // Trà Trái Cây
    ensureProduct({
      data: {
        sku: 'TTC-001', name: 'Trà Đào Cam Sả', type: ProductType.DRINK,
        basePrice: 40000, categoryId: categories[1].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TTC-002', name: 'Trà Vải Lychee', type: ProductType.DRINK,
        basePrice: 42000, categoryId: categories[1].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'TTC-003', name: 'Trà Chanh Dây Passion', type: ProductType.DRINK,
        basePrice: 38000, categoryId: categories[1].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),

    // Cà Phê
    ensureProduct({
      data: {
        sku: 'CF-001', name: 'Cà Phê Sữa Đá', type: ProductType.DRINK,
        basePrice: 35000, categoryId: categories[2].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'CF-002', name: 'Latte Macchiato', type: ProductType.DRINK,
        basePrice: 52000, categoryId: categories[2].id,
        sizes: { create: [
          { name: 'S', priceAdj: 0 }, { name: 'M', priceAdj: 5000 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),

    // Đá Xay
    ensureProduct({
      data: {
        sku: 'DX-001', name: 'Sinh Tố Bơ', type: ProductType.DRINK,
        basePrice: 48000, categoryId: categories[3].id,
        sizes: { create: [
          { name: 'M', priceAdj: 0 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
    ensureProduct({
      data: {
        sku: 'DX-002', name: 'Đá Xay Oreo', type: ProductType.DRINK,
        basePrice: 50000, categoryId: categories[3].id,
        sizes: { create: [
          { name: 'M', priceAdj: 0 }, { name: 'L', priceAdj: 10000 },
        ]},
      },
      include: { sizes: true },
    }),
  ]);
  console.log(`✅ Created ${drinks.length} drink products`);

  // ============================================================
  // 5. PRODUCTS — Toppings
  // ============================================================
  const toppings = await Promise.all([
    ensureProduct({
      data: { sku: 'TP-001', name: 'Trân Châu Đen', type: ProductType.TOPPING, basePrice: 8000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-002', name: 'Trân Châu Trắng', type: ProductType.TOPPING, basePrice: 8000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-003', name: 'Thạch Dừa', type: ProductType.TOPPING, basePrice: 6000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-004', name: 'Pudding Trứng', type: ProductType.TOPPING, basePrice: 10000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-005', name: 'Kem Cheese', type: ProductType.TOPPING, basePrice: 12000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-006', name: 'Thạch Cà Phê', type: ProductType.TOPPING, basePrice: 7000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-007', name: 'Sương Sáo', type: ProductType.TOPPING, basePrice: 6000, categoryId: categories[4].id },
    }),
    ensureProduct({
      data: { sku: 'TP-008', name: 'Shot Espresso', type: ProductType.TOPPING, basePrice: 15000, categoryId: categories[4].id },
    }),
  ]);
  console.log(`✅ Created ${toppings.length} topping products`);

  // ============================================================
  // 6. PRODUCTS — Raw Materials (for inventory)
  // ============================================================
  const materials = await Promise.all([
    ensureProduct({ data: { sku: 'MAT-001', name: 'Trà đen (lá)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-002', name: 'Trà xanh Matcha (bột)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-003', name: 'Sữa tươi', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-004', name: 'Sữa đặc', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-005', name: 'Đường nâu (syrup)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-006', name: 'Bột taro', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-007', name: 'Trà Oolong (lá)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-008', name: 'Trân châu đen (viên)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-009', name: 'Trân châu trắng (viên)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-010', name: 'Thạch dừa', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-011', name: 'Đào lon', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-012', name: 'Cam tươi', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-013', name: 'Sả tươi', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-014', name: 'Ly nhựa 500ml', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-015', name: 'Ly nhựa 700ml', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-016', name: 'Nắp ly', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-017', name: 'Ống hút', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-018', name: 'Cà phê hạt rang', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-019', name: 'Pudding trứng (viên)', type: ProductType.MATERIAL, basePrice: 0 } }),
    ensureProduct({ data: { sku: 'MAT-020', name: 'Kem cheese (hộp)', type: ProductType.MATERIAL, basePrice: 0 } }),
  ]);
  console.log(`✅ Created ${materials.length} raw materials`);

  // ============================================================
  // 7. RECIPES — Define BOM for drinks
  // ============================================================
  // Trà Sữa Trân Châu Đường Đen (size M)
  const sizeM_ts001 = drinks[0].sizes.find(s => s.name === 'M')!;
  const sizeS_ts001 = drinks[0].sizes.find(s => s.name === 'S')!;
  const sizeL_ts001 = drinks[0].sizes.find(s => s.name === 'L')!;

  await ensureRecipes({
    data: [
      // Trà Sữa Trân Châu Đường Đen — Size S
      { drinkId: drinks[0].id, materialId: materials[0].id, sizeId: sizeS_ts001.id, quantity: 150, unit: 'ml' }, // Trà đen
      { drinkId: drinks[0].id, materialId: materials[2].id, sizeId: sizeS_ts001.id, quantity: 80, unit: 'ml' },  // Sữa tươi
      { drinkId: drinks[0].id, materialId: materials[4].id, sizeId: sizeS_ts001.id, quantity: 20, unit: 'ml' },  // Đường nâu
      { drinkId: drinks[0].id, materialId: materials[7].id, sizeId: sizeS_ts001.id, quantity: 30, unit: 'g' },   // Trân châu đen
      { drinkId: drinks[0].id, materialId: materials[13].id, sizeId: sizeS_ts001.id, quantity: 1, unit: 'pcs' }, // Ly 500ml
      { drinkId: drinks[0].id, materialId: materials[15].id, sizeId: sizeS_ts001.id, quantity: 1, unit: 'pcs' }, // Nắp
      { drinkId: drinks[0].id, materialId: materials[16].id, sizeId: sizeS_ts001.id, quantity: 1, unit: 'pcs' }, // Ống hút

      // Trà Sữa Trân Châu Đường Đen — Size M
      { drinkId: drinks[0].id, materialId: materials[0].id, sizeId: sizeM_ts001.id, quantity: 200, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[2].id, sizeId: sizeM_ts001.id, quantity: 120, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[4].id, sizeId: sizeM_ts001.id, quantity: 30, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[7].id, sizeId: sizeM_ts001.id, quantity: 50, unit: 'g' },
      { drinkId: drinks[0].id, materialId: materials[14].id, sizeId: sizeM_ts001.id, quantity: 1, unit: 'pcs' }, // Ly 700ml
      { drinkId: drinks[0].id, materialId: materials[15].id, sizeId: sizeM_ts001.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[0].id, materialId: materials[16].id, sizeId: sizeM_ts001.id, quantity: 1, unit: 'pcs' },

      // Trà Sữa Trân Châu Đường Đen — Size L
      { drinkId: drinks[0].id, materialId: materials[0].id, sizeId: sizeL_ts001.id, quantity: 250, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[2].id, sizeId: sizeL_ts001.id, quantity: 150, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[4].id, sizeId: sizeL_ts001.id, quantity: 40, unit: 'ml' },
      { drinkId: drinks[0].id, materialId: materials[7].id, sizeId: sizeL_ts001.id, quantity: 70, unit: 'g' },
      { drinkId: drinks[0].id, materialId: materials[14].id, sizeId: sizeL_ts001.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[0].id, materialId: materials[15].id, sizeId: sizeL_ts001.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[0].id, materialId: materials[16].id, sizeId: sizeL_ts001.id, quantity: 1, unit: 'pcs' },
    ],
  });

  // Trà Sữa Matcha — Size M (simplified, one size example)
  const sizeM_ts002 = drinks[1].sizes.find(s => s.name === 'M')!;
  await ensureRecipes({
    data: [
      { drinkId: drinks[1].id, materialId: materials[1].id, sizeId: sizeM_ts002.id, quantity: 15, unit: 'g' },   // Matcha
      { drinkId: drinks[1].id, materialId: materials[2].id, sizeId: sizeM_ts002.id, quantity: 150, unit: 'ml' }, // Sữa tươi
      { drinkId: drinks[1].id, materialId: materials[4].id, sizeId: sizeM_ts002.id, quantity: 20, unit: 'ml' },  // Đường
      { drinkId: drinks[1].id, materialId: materials[14].id, sizeId: sizeM_ts002.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[1].id, materialId: materials[15].id, sizeId: sizeM_ts002.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[1].id, materialId: materials[16].id, sizeId: sizeM_ts002.id, quantity: 1, unit: 'pcs' },
    ],
  });

  // Trà Đào Cam Sả — Size M
  const sizeM_ttc001 = drinks[5].sizes.find(s => s.name === 'M')!;
  await ensureRecipes({
    data: [
      { drinkId: drinks[5].id, materialId: materials[0].id, sizeId: sizeM_ttc001.id, quantity: 150, unit: 'ml' }, // Trà đen
      { drinkId: drinks[5].id, materialId: materials[10].id, sizeId: sizeM_ttc001.id, quantity: 50, unit: 'g' },  // Đào lon
      { drinkId: drinks[5].id, materialId: materials[11].id, sizeId: sizeM_ttc001.id, quantity: 30, unit: 'ml' }, // Cam
      { drinkId: drinks[5].id, materialId: materials[12].id, sizeId: sizeM_ttc001.id, quantity: 5, unit: 'g' },   // Sả
      { drinkId: drinks[5].id, materialId: materials[14].id, sizeId: sizeM_ttc001.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[5].id, materialId: materials[15].id, sizeId: sizeM_ttc001.id, quantity: 1, unit: 'pcs' },
      { drinkId: drinks[5].id, materialId: materials[16].id, sizeId: sizeM_ttc001.id, quantity: 1, unit: 'pcs' },
    ],
  });

  console.log('✅ Created recipes for sample drinks');

  // ============================================================
  // 8. INVENTORIES — Initial stock for branch 1
  // ============================================================
  const inventoryData = [
    { materialId: materials[0].id, currentStock: 5000, minStock: 1000, unit: 'ml' },  // Trà đen
    { materialId: materials[1].id, currentStock: 2000, minStock: 500, unit: 'g' },     // Matcha
    { materialId: materials[2].id, currentStock: 20000, minStock: 5000, unit: 'ml' },  // Sữa tươi
    { materialId: materials[3].id, currentStock: 5000, minStock: 1000, unit: 'ml' },   // Sữa đặc
    { materialId: materials[4].id, currentStock: 3000, minStock: 500, unit: 'ml' },    // Đường nâu
    { materialId: materials[5].id, currentStock: 1500, minStock: 300, unit: 'g' },     // Bột taro
    { materialId: materials[6].id, currentStock: 3000, minStock: 500, unit: 'ml' },    // Trà oolong
    { materialId: materials[7].id, currentStock: 5000, minStock: 1000, unit: 'g' },    // Trân châu đen
    { materialId: materials[8].id, currentStock: 3000, minStock: 500, unit: 'g' },     // Trân châu trắng
    { materialId: materials[9].id, currentStock: 3000, minStock: 500, unit: 'g' },     // Thạch dừa
    { materialId: materials[10].id, currentStock: 2000, minStock: 500, unit: 'g' },    // Đào lon
    { materialId: materials[11].id, currentStock: 5000, minStock: 1000, unit: 'ml' },  // Cam
    { materialId: materials[12].id, currentStock: 1000, minStock: 200, unit: 'g' },    // Sả
    { materialId: materials[13].id, currentStock: 500, minStock: 100, unit: 'pcs' },   // Ly 500ml
    { materialId: materials[14].id, currentStock: 500, minStock: 100, unit: 'pcs' },   // Ly 700ml
    { materialId: materials[15].id, currentStock: 1000, minStock: 200, unit: 'pcs' },  // Nắp
    { materialId: materials[16].id, currentStock: 1000, minStock: 200, unit: 'pcs' },  // Ống hút
    { materialId: materials[17].id, currentStock: 3000, minStock: 500, unit: 'g' },    // Cà phê
    { materialId: materials[18].id, currentStock: 500, minStock: 100, unit: 'pcs' },   // Pudding
    { materialId: materials[19].id, currentStock: 2000, minStock: 300, unit: 'g' },    // Kem cheese
  ];

  // Create inventory for all 5 branches. Existing balances are never reset.
  for (const branch of branches) {
    for (const inventory of inventoryData) {
      await prisma.inventory.upsert({
        where: {
          branchId_materialId: {
            branchId: branch.id,
            materialId: inventory.materialId,
          },
        },
        create: { branchId: branch.id, ...inventory },
        update: { minStock: inventory.minStock, unit: inventory.unit },
      });
    }
  }
  console.log('✅ Ensured inventory for all 5 branches');

  // ============================================================
  // 9. CUSTOMERS (sample)
  // ============================================================
  const customerSeeds: Prisma.CustomerUncheckedCreateInput[] = [
    { fullName: 'Nguyễn Thị Lan', phone: '0912345001', email: 'lan@email.com', totalPoints: 150 },
    { fullName: 'Trần Văn Minh', phone: '0912345002', totalPoints: 80 },
    { fullName: 'Phạm Thị Hoa', phone: '0912345003', email: 'hoa@email.com', totalPoints: 320 },
    { fullName: 'Lê Hoàng Nam', phone: '0912345004', totalPoints: 50 },
    { fullName: 'Đặng Thùy Linh', phone: '0912345005', email: 'linh@email.com', totalPoints: 200 },
  ];
  for (const customer of customerSeeds) {
    const { phone, totalPoints: _initialPoints, ...profile } = customer;
    await prisma.customer.upsert({
      where: { phone },
      create: customer,
      update: profile,
    });
  }
  console.log('✅ Ensured 5 sample customers');

  // ============================================================
  // 10. PROMOTIONS (sample)
  // ============================================================
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const promotionSeeds: Prisma.PromotionUncheckedCreateInput[] = [
      {
        name: 'Giảm 10% Khai Trương', description: 'Giảm 10% tổng hóa đơn nhân dịp khai trương chi nhánh mới',
        type: PromotionType.PERCENTAGE, value: 10, maxDiscount: 30000,
        startDate: now, endDate: nextMonth, isActive: true,
      },
      {
        name: 'Giảm 20K đơn từ 100K', description: 'Giảm 20,000đ cho hóa đơn từ 100,000đ trở lên',
        type: PromotionType.FIXED_AMOUNT, value: 20000, minOrderValue: 100000,
        startDate: now, endDate: nextMonth, isActive: true,
      },
      {
        name: 'Happy Hour 50%', description: 'Giảm 50% từ 14h-16h hàng ngày (đã kết thúc)',
        type: PromotionType.PERCENTAGE, value: 50, maxDiscount: 50000,
        startDate: new Date('2024-01-01'), endDate: new Date('2024-02-01'), isActive: false,
      },
  ];
  for (const promotion of promotionSeeds) {
    await ensurePromotion(promotion);
  }
  console.log('✅ Ensured 3 sample promotions');

  // ============================================================
  // 11. ANNOUNCEMENTS (sample)
  // ============================================================
  const announcementSeeds: Prisma.AnnouncementUncheckedCreateInput[] = [
      {
        title: 'Thông báo lịch họp tháng 9',
        content: 'Kính gửi toàn thể nhân viên, cuộc họp tháng 9 sẽ diễn ra vào lúc 9h sáng ngày 15/09 tại chi nhánh Q1. Mọi người vui lòng sắp xếp tham dự đầy đủ.',
        authorId: users[0].id,
      },
      {
        title: 'Chính sách thưởng quý 3/2024',
        content: 'Nhân viên có doanh số bán hàng đạt KPI sẽ nhận thưởng 2 triệu đồng. Chi tiết KPI xin liên hệ quản lý chi nhánh.',
        authorId: users[0].id,
      },
  ];
  for (const announcement of announcementSeeds) {
    await ensureAnnouncement(announcement);
  }
  console.log('✅ Ensured 2 sample announcements');

  console.log('\n🧋 Seed completed successfully!');
  console.log('📝 Default login: admin@teap.vn / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
