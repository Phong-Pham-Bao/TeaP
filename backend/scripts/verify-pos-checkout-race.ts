import './assert-test-database';
import {
  IdempotencyStatus,
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  ProductType,
  Role,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AuthenticatedActor } from '../src/common/types/authenticated-actor';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/modules/platform/audit.service';
import { DocumentSequenceService } from '../src/modules/platform/document-sequence.service';
import { IdempotencyService } from '../src/modules/platform/idempotency.service';
import { OutboxService } from '../src/modules/platform/outbox.service';
import { PosService } from '../src/modules/pos/pos.service';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const idempotency = new IdempotencyService(
  prismaService,
  new ConfigService({ IDEMPOTENCY_TTL_HOURS: '24' }),
);
const posService = new PosService(
  prismaService,
  new AuditService(),
  idempotency,
  new OutboxService(prismaService),
  new DocumentSequenceService(),
);

async function main() {
  const runId = randomUUID();
  const branchId = randomUUID();
  const cashierId = randomUUID();
  const drinkId = randomUUID();
  const materialId = randomUUID();
  const inventoryId = randomUUID();
  const orderId = randomUUID();
  const correlations = [`pos-race-a-${runId}`, `pos-race-b-${runId}`];
  const actor: AuthenticatedActor = {
    userId: cashierId,
    email: `pos-race-${runId}@example.test`,
    role: Role.CASHIER,
    branchId,
    allowedBranchIds: [branchId],
    sessionId: randomUUID(),
  };

  try {
    await prisma.branch.create({
      data: {
        id: branchId,
        name: `POS race branch ${runId}`,
        address: 'Test only',
      },
    });
    await prisma.user.create({
      data: {
        id: cashierId,
        email: actor.email,
        password: 'not-a-real-password',
        fullName: 'POS race cashier',
        role: Role.CASHIER,
        branchId,
      },
    });
    await prisma.product.createMany({
      data: [
        {
          id: drinkId,
          sku: `DRINK-${runId}`,
          name: 'Race test drink',
          type: ProductType.DRINK,
          basePrice: 45_000,
        },
        {
          id: materialId,
          sku: `MATERIAL-${runId}`,
          name: 'Race test material',
          type: ProductType.MATERIAL,
          basePrice: 0,
        },
      ],
    });
    await prisma.recipeItem.create({
      data: {
        drinkId,
        materialId,
        quantity: 1,
        unit: 'unit',
      },
    });
    await prisma.inventory.create({
      data: {
        id: inventoryId,
        branchId,
        materialId,
        currentStock: 10,
        minStock: 0,
        unit: 'unit',
      },
    });
    await prisma.order.create({
      data: {
        id: orderId,
        orderNumber: `RACE-${runId.slice(0, 8)}`,
        branchId,
        cashierId,
        subtotal: 45_000,
        discount: 0,
        totalAmount: 45_000,
        status: OrderStatus.PENDING,
        items: {
          create: {
            productId: drinkId,
            qty: 1,
            unitPrice: 45_000,
            subtotal: 45_000,
          },
        },
      },
    });

    const checkouts = await Promise.allSettled([
      posService.checkout(
        orderId,
        { paymentMethod: PaymentMethod.CASH, amountPaid: 45_000 },
        actor,
        `pos-race-key-a-${runId}`,
        correlations[0],
      ),
      posService.checkout(
        orderId,
        { paymentMethod: PaymentMethod.CASH, amountPaid: 45_000 },
        actor,
        `pos-race-key-b-${runId}`,
        correlations[1],
      ),
    ]);
    const successfulCheckouts = checkouts.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    if (successfulCheckouts !== 1) {
      throw new Error(
        `Expected one successful checkout, got ${successfulCheckouts}`,
      );
    }

    const [order, paymentCount, ledgerCount, inventory, completedOperations] =
      await Promise.all([
        prisma.order.findUnique({ where: { id: orderId } }),
        prisma.payment.count({ where: { orderId } }),
        prisma.stockLedger.count({ where: { refId: orderId } }),
        prisma.inventory.findUnique({ where: { id: inventoryId } }),
        prisma.idempotencyRecord.count({
          where: {
            actorId: cashierId,
            action: 'POS_CHECKOUT',
            status: IdempotencyStatus.COMPLETED,
          },
        }),
      ]);
    if (order?.status !== OrderStatus.PAID) {
      throw new Error('The winning checkout did not mark the order as paid');
    }
    if (paymentCount !== 1 || ledgerCount !== 1) {
      throw new Error(
        `Expected one payment and one stock entry, got ${paymentCount}/${ledgerCount}`,
      );
    }
    if (!inventory?.currentStock.equals(9)) {
      throw new Error(
        `Expected stock 9 after one checkout, got ${inventory?.currentStock.toString()}`,
      );
    }
    if (completedOperations !== 1) {
      throw new Error(
        `Expected one completed idempotent operation, got ${completedOperations}`,
      );
    }

    console.log(
      'POS checkout race verification passed: one payment, one stock deduction and one completed operation',
    );
  } finally {
    await prisma.outboxEvent.deleteMany({
      where: { correlationId: { in: correlations } },
    });
    await prisma.auditEvent.deleteMany({
      where: { correlationId: { in: correlations } },
    });
    await prisma.idempotencyRecord.deleteMany({
      where: { actorId: cashierId, action: 'POS_CHECKOUT' },
    });
    await prisma.stockLedger.deleteMany({ where: { refId: orderId } });
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.recipeItem.deleteMany({ where: { drinkId } });
    await prisma.inventory.deleteMany({ where: { id: inventoryId } });
    await prisma.product.deleteMany({
      where: { id: { in: [drinkId, materialId] } },
    });
    await prisma.user.deleteMany({ where: { id: cashierId } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
