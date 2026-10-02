import './assert-test-database';
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();
const backendRoot = path.resolve(__dirname, '..');

type OrphanRow = { relation: string; count: number };

function runNodeScript(scriptPath: string, args: string[] = []) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${scriptPath} failed with exit ${result.status}`);
  }
}

const decimalString = (value: { toString(): string } | null) =>
  value?.toString() ?? '0';

async function snapshotBusinessData() {
  const [
    branches,
    users,
    categories,
    products,
    orders,
    payments,
    inventories,
    stockLedgers,
    customers,
    orderTotals,
    paymentTotals,
    stockTotals,
    movementTotals,
    pointTotals,
  ] = await Promise.all([
    prisma.branch.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.inventory.count(),
    prisma.stockLedger.count(),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.inventory.aggregate({ _sum: { currentStock: true } }),
    prisma.stockLedger.aggregate({ _sum: { changeQty: true } }),
    prisma.customer.aggregate({ _sum: { totalPoints: true } }),
  ]);

  return {
    counts: {
      branches,
      users,
      categories,
      products,
      orders,
      payments,
      inventories,
      stockLedgers,
      customers,
    },
    controlTotals: {
      orders: decimalString(orderTotals._sum.totalAmount),
      payments: decimalString(paymentTotals._sum.amount),
      inventory: decimalString(stockTotals._sum.currentStock),
      movements: decimalString(movementTotals._sum.changeQty),
      customerPoints: pointTotals._sum.totalPoints ?? 0,
    },
  };
}

async function findOrphans() {
  const rows = await prisma.$queryRaw<OrphanRow[]>`
    SELECT 'users.branch_id' AS relation, COUNT(*)::int AS count
    FROM users child LEFT JOIN branches parent ON parent.id = child.branch_id
    WHERE child.branch_id IS NOT NULL AND parent.id IS NULL
    UNION ALL
    SELECT 'products.category_id', COUNT(*)::int
    FROM products child LEFT JOIN categories parent ON parent.id = child.category_id
    WHERE child.category_id IS NOT NULL AND parent.id IS NULL
    UNION ALL
    SELECT 'orders.branch_id', COUNT(*)::int
    FROM orders child LEFT JOIN branches parent ON parent.id = child.branch_id
    WHERE parent.id IS NULL
    UNION ALL
    SELECT 'orders.cashier_id', COUNT(*)::int
    FROM orders child LEFT JOIN users parent ON parent.id = child.cashier_id
    WHERE parent.id IS NULL
    UNION ALL
    SELECT 'order_items.order_id', COUNT(*)::int
    FROM order_items child LEFT JOIN orders parent ON parent.id = child.order_id
    WHERE parent.id IS NULL
    UNION ALL
    SELECT 'payments.order_id', COUNT(*)::int
    FROM payments child LEFT JOIN orders parent ON parent.id = child.order_id
    WHERE parent.id IS NULL
    UNION ALL
    SELECT 'inventories.branch_id', COUNT(*)::int
    FROM inventories child LEFT JOIN branches parent ON parent.id = child.branch_id
    WHERE parent.id IS NULL
    UNION ALL
    SELECT 'inventories.material_id', COUNT(*)::int
    FROM inventories child LEFT JOIN products parent ON parent.id = child.material_id
    WHERE parent.id IS NULL
  `;
  return rows.filter((row) => row.count > 0);
}

async function main() {
  if (process.env.UPGRADE_REHEARSAL_ACK !== 'clone-test-only') {
    throw new Error(
      'Set UPGRADE_REHEARSAL_ACK=clone-test-only after confirming this is a disposable or approved clone.',
    );
  }

  const before = await snapshotBusinessData();
  const orphans = await findOrphans();
  if (orphans.length > 0) {
    console.error(JSON.stringify({ before, orphans }, null, 2));
    throw new Error('Orphan records found; migration rehearsal stopped');
  }

  const tsNodeBin = require.resolve('ts-node/dist/bin.js');
  runNodeScript(tsNodeBin, ['scripts/standardize-data.ts']);

  const prismaBin = require.resolve('prisma/build/index.js');
  runNodeScript(prismaBin, ['migrate', 'deploy']);

  const after = await snapshotBusinessData();
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(
      `Business reconciliation changed during migration:\nbefore=${JSON.stringify(before)}\nafter=${JSON.stringify(after)}`,
    );
  }

  runNodeScript(prismaBin, [
    'migrate',
    'diff',
    '--from-url',
    process.env.DATABASE_URL!,
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--exit-code',
  ]);

  console.log(
    JSON.stringify(
      {
        result: 'PASS',
        target: 'approved local _test clone',
        before,
        after,
        orphans,
        drift: 'none',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
