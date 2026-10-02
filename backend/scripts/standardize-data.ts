import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const applyChanges = process.env.DATA_STANDARDIZATION_APPLY === 'true';
const acknowledged =
  process.env.DATA_STANDARDIZATION_ACK === 'reviewed-collision-report';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string | null) =>
  value ? value.replace(/[^\d+]/g, '') : null;
const normalizeSku = (value: string) => value.trim().toUpperCase();

type Collision = {
  entity: string;
  field: string;
  normalizedValue: string;
  ids: string[];
};

function findCollisions<T extends { id: string }>(
  rows: T[],
  entity: string,
  field: string,
  normalize: (row: T) => string | null,
) {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const value = normalize(row);
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), row.id]);
  }
  return [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map<Collision>(([normalizedValue, ids]) => ({
      entity,
      field,
      normalizedValue,
      ids,
    }));
}

async function main() {
  const [users, customers, products, branches, categories] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, phone: true } }),
    prisma.customer.findMany({
      select: { id: true, phone: true, email: true, fullName: true },
    }),
    prisma.product.findMany({ select: { id: true, sku: true } }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const collisions = [
    ...findCollisions(users, 'User', 'email', (row) =>
      normalizeEmail(row.email),
    ),
    ...findCollisions(users, 'User', 'phone', (row) =>
      normalizePhone(row.phone),
    ),
    ...findCollisions(customers, 'Customer', 'phone', (row) =>
      normalizePhone(row.phone),
    ),
    ...findCollisions(products, 'Product', 'sku', (row) =>
      normalizeSku(row.sku),
    ),
    ...findCollisions(branches, 'Branch', 'name', (row) =>
      row.name.trim().toLowerCase(),
    ),
    ...findCollisions(categories, 'Category', 'name', (row) =>
      row.name.trim().toLowerCase(),
    ),
  ];

  const userUpdates = users
    .map((user) => ({
      id: user.id,
      email: normalizeEmail(user.email),
      phone: normalizePhone(user.phone),
      changed:
        normalizeEmail(user.email) !== user.email ||
        normalizePhone(user.phone) !== user.phone,
    }))
    .filter((row) => row.changed);

  const customerUpdates = customers
    .map((customer) => ({
      id: customer.id,
      phone: normalizePhone(customer.phone) ?? customer.phone,
      email: customer.email ? normalizeEmail(customer.email) : null,
      fullName: customer.fullName.trim(),
      changed:
        normalizePhone(customer.phone) !== customer.phone ||
        (customer.email ? normalizeEmail(customer.email) : null) !==
          customer.email ||
        customer.fullName.trim() !== customer.fullName,
    }))
    .filter((row) => row.changed);

  const productUpdates = products
    .map((product) => ({
      id: product.id,
      sku: normalizeSku(product.sku),
      changed: normalizeSku(product.sku) !== product.sku,
    }))
    .filter((row) => row.changed);

  const report = {
    mode: applyChanges ? 'apply' : 'dry-run',
    scanned: {
      users: users.length,
      customers: customers.length,
      products: products.length,
      branches: branches.length,
      categories: categories.length,
    },
    proposedUpdates: {
      users: userUpdates.length,
      customers: customerUpdates.length,
      products: productUpdates.length,
    },
    collisions,
  };
  console.log(JSON.stringify(report, null, 2));

  if (collisions.length > 0) {
    throw new Error(
      'Normalization collisions found. Resolve or approve a mapping before applying changes.',
    );
  }
  if (!applyChanges) return;
  if (!acknowledged) {
    throw new Error(
      'Set DATA_STANDARDIZATION_ACK=reviewed-collision-report after reviewing the dry-run report.',
    );
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    ...userUpdates.map(({ id, email, phone }) =>
      prisma.user.update({ where: { id }, data: { email, phone } }),
    ),
    ...customerUpdates.map(({ id, phone, email, fullName }) =>
      prisma.customer.update({
        where: { id },
        data: { phone, email, fullName },
      }),
    ),
    ...productUpdates.map(({ id, sku }) =>
      prisma.product.update({ where: { id }, data: { sku } }),
    ),
  ];

  for (let index = 0; index < operations.length; index += 100) {
    await prisma.$transaction(operations.slice(index, index + 100));
  }
  console.log(`Applied ${operations.length} reviewed normalization updates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
