import './assert-test-database';
import { Prisma, PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();
const backendRoot = path.resolve(__dirname, '..');

async function snapshotCounts() {
  const [
    branches,
    users,
    categories,
    products,
    productSizes,
    recipes,
    inventories,
    customers,
    promotions,
    announcements,
  ] = await Promise.all([
    prisma.branch.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productSize.count(),
    prisma.recipeItem.count(),
    prisma.inventory.count(),
    prisma.customer.count(),
    prisma.promotion.count(),
    prisma.announcement.count(),
  ]);
  return {
    branches,
    users,
    categories,
    products,
    productSizes,
    recipes,
    inventories,
    customers,
    promotions,
    announcements,
  };
}

function runSeed() {
  const tsNodeBin = require.resolve('ts-node/dist/bin.js');
  const result = spawnSync(process.execPath, [tsNodeBin, 'prisma/seed.ts'], {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `Seed failed with exit ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }
}

async function main() {
  runSeed();
  const afterFirstRun = await snapshotCounts();
  const inventory = await prisma.inventory.findFirst({ orderBy: { id: 'asc' } });
  if (!inventory) throw new Error('Seed did not create an inventory fixture');

  const expectedStock = new Prisma.Decimal(inventory.currentStock).plus(1);
  await prisma.inventory.update({
    where: { id: inventory.id },
    data: { currentStock: expectedStock },
  });

  try {
    runSeed();
    const afterSecondRun = await snapshotCounts();
    if (JSON.stringify(afterFirstRun) !== JSON.stringify(afterSecondRun)) {
      throw new Error(
        `Seed duplicated rows:\nfirst=${JSON.stringify(afterFirstRun)}\nsecond=${JSON.stringify(afterSecondRun)}`,
      );
    }

    const inventoryAfterSecondRun = await prisma.inventory.findUniqueOrThrow({
      where: { id: inventory.id },
    });
    if (!inventoryAfterSecondRun.currentStock.equals(expectedStock)) {
      throw new Error(
        'Seed overwrote an existing inventory balance instead of preserving it',
      );
    }

    console.log(
      `Seed idempotency verified: ${JSON.stringify(afterSecondRun)}`,
    );
  } finally {
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { currentStock: inventory.currentStock },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
