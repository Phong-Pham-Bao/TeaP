import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import {
  OrderStatus,
  PaymentStatus,
  StockRefType,
  Prisma,
  ProductType,
  Role,
  PaymentMethod,
} from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { assertBranchScope } from '../../common/auth/branch-scope';
import { AuditService } from '../platform/audit.service';
import { IdempotencyService } from '../platform/idempotency.service';
import { OutboxService } from '../platform/outbox.service';
import { businessTimestampRange } from '../../common/time/business-time';
import {
  addVnd,
  minVnd,
  multiplyVnd,
  percentageOfVnd,
  subtractVnd,
  vnd,
} from '../../common/money/vietnamese-dong';
import { toOrderResponse } from './dto/order-response.dto';
import { DocumentSequenceService } from '../platform/document-sequence.service';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly outbox: OutboxService,
    private readonly documentSequence: DocumentSequenceService,
  ) {}

  async createOrder(
    dto: CreateOrderDto,
    actor: AuthenticatedActor,
    rawIdempotencyKey: string | undefined,
    correlationId: string,
  ) {
    const key = this.idempotency.validateKey(rawIdempotencyKey);
    const identity = {
      actorId: actor.userId,
      scopeKey: dto.branchId,
      action: 'POS_CREATE_ORDER',
      key,
    };
    const requestHash = this.idempotency.hashRequest(dto);
    const existing = await this.idempotency.resolveExisting(
      identity,
      requestHash,
    );
    if (existing.found) return existing.responseBody;

    let subtotal = vnd(0);
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
      [];

    // 1. Validate all products & calculate prices
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product ${item.productId} not found or inactive`,
        );
      }

      let unitPrice = vnd(product.basePrice);

      // Check size
      if (item.sizeId) {
        const size = await this.prisma.productSize.findUnique({
          where: { id: item.sizeId },
        });
        if (!size || size.productId !== product.id) {
          throw new BadRequestException(
            `Invalid size for product ${product.name}`,
          );
        }
        unitPrice = addVnd(unitPrice, size.priceAdj);
      }

      // Check toppings
      let toppingsCost = vnd(0);
      if (item.attributes?.toppings && item.attributes.toppings.length > 0) {
        for (const toppingId of item.attributes.toppings) {
          const topping = await this.prisma.product.findUnique({
            where: { id: toppingId },
          });
          if (!topping || topping.type !== ProductType.TOPPING) {
            throw new BadRequestException(`Invalid topping ID: ${toppingId}`);
          }
          toppingsCost = addVnd(toppingsCost, topping.basePrice);
        }
      }

      unitPrice = addVnd(unitPrice, toppingsCost);
      const itemSubtotal = multiplyVnd(unitPrice, item.qty);
      subtotal = addVnd(subtotal, itemSubtotal);

      orderItemsData.push({
        productId: item.productId,
        sizeId: item.sizeId,
        qty: item.qty,
        unitPrice: unitPrice,
        subtotal: itemSubtotal,
        attributes: item.attributes
          ? (item.attributes as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      });
    }

    // 2. Promotions
    let discount = vnd(0);
    if (dto.promotionId) {
      const promo = await this.prisma.promotion.findUnique({
        where: { id: dto.promotionId },
      });
      const now = new Date();
      if (
        !promo ||
        !promo.isActive ||
        promo.startDate > now ||
        promo.endDate < now
      ) {
        throw new BadRequestException('Invalid or expired promotion');
      }
      if (promo.minOrderValue && subtotal.lt(promo.minOrderValue)) {
        throw new BadRequestException(
          'Minimum order value for promotion not met',
        );
      }

      if (promo.type === 'PERCENTAGE') {
        let calcDiscount = percentageOfVnd(subtotal, promo.value);
        if (promo.maxDiscount && calcDiscount.gt(promo.maxDiscount)) {
          calcDiscount = vnd(promo.maxDiscount);
        }
        discount = calcDiscount;
      } else if (promo.type === 'FIXED_AMOUNT') {
        discount = vnd(promo.value);
      } else {
        throw new BadRequestException(
          `Promotion type ${promo.type} is not supported at checkout`,
        );
      }
      discount = minVnd(discount, subtotal);
    }

    const totalAmount = subtractVnd(subtotal, discount);
    if (totalAmount.lt(0))
      throw new BadRequestException('Total amount cannot be negative');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const idempotencyRecord = await this.idempotency.start(tx, {
          ...identity,
          requestHash,
        });
        const orderNumber = await this.documentSequence.next(tx, {
          documentType: 'POS_ORDER',
          prefix: 'ORD',
          branchId: dto.branchId,
        });
        const order = await tx.order.create({
          data: {
            orderNumber,
            branchId: dto.branchId,
            cashierId: actor.userId,
            customerId: dto.customerId,
            promotionId: dto.promotionId,
            subtotal,
            discount,
            totalAmount,
            status: OrderStatus.PENDING,
            note: dto.note,
            items: {
              create: orderItemsData,
            },
          },
          include: { items: true },
        });
        const response = toOrderResponse(order);
        await this.audit.record(tx, {
          actorId: actor.userId,
          branchId: dto.branchId,
          action: 'POS.ORDER_CREATED',
          resourceType: 'Order',
          resourceId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            totalAmount: totalAmount.toString(),
            itemCount: dto.items.reduce((sum, item) => sum + item.qty, 0),
          },
          correlationId,
        });
        await this.idempotency.complete(
          tx,
          idempotencyRecord.id,
          this.idempotency.toJson(response),
          'Order',
          order.id,
          201,
        );
        return response;
      });
    } catch (error) {
      const uniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (uniqueConflict) {
        const replay = await this.idempotency.resolveExisting(
          identity,
          requestHash,
        );
        if (replay.found) return replay.responseBody;
      }
      throw error;
    }
  }

  async checkout(
    orderId: string,
    dto: CheckoutDto,
    actor: AuthenticatedActor,
    rawIdempotencyKey: string | undefined,
    correlationId: string,
  ) {
    if (dto.paymentMethod !== PaymentMethod.CASH) {
      throw new BadRequestException(
        'Electronic payments are unavailable until provider verification is configured',
      );
    }

    const key = this.idempotency.validateKey(rawIdempotencyKey);
    const identity = {
      actorId: actor.userId,
      scopeKey: actor.branchId || 'GLOBAL',
      action: 'POS_CHECKOUT',
      key,
    };
    const requestHash = this.idempotency.hashRequest({
      orderId,
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      transactionId: dto.transactionId || null,
    });
    const existing = await this.idempotency.resolveExisting(
      identity,
      requestHash,
    );
    if (existing.found) return existing.responseBody;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const idempotencyRecord = await this.idempotency.start(tx, {
              ...identity,
              requestHash,
            });
            await tx.$queryRaw`
            SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE
          `;
            const order = await tx.order.findUnique({
              where: { id: orderId },
              include: { items: { include: { product: true } } },
            });

            if (!order) throw new NotFoundException('Order not found');
            assertBranchScope(actor, order.branchId);
            if (order.status !== OrderStatus.PENDING) {
              throw new BadRequestException('Order already processed');
            }
            if (vnd(dto.amountPaid).lt(vnd(order.totalAmount))) {
              throw new BadRequestException('Insufficient payment amount');
            }

            const requiredMaterials = new Map<string, Prisma.Decimal>();
            const addRequirement = (
              materialId: string,
              quantity: Prisma.Decimal,
            ) => {
              requiredMaterials.set(
                materialId,
                (
                  requiredMaterials.get(materialId) || new Prisma.Decimal(0)
                ).add(quantity),
              );
            };

            for (const item of order.items) {
              if (item.product.type === ProductType.DRINK) {
                const recipeItems = await tx.recipeItem.findMany({
                  where: {
                    drinkId: item.productId,
                    OR: [{ sizeId: item.sizeId }, { sizeId: null }],
                  },
                });
                if (recipeItems.length === 0) {
                  throw new BadRequestException(
                    `No recipe is configured for ${item.product.name}`,
                  );
                }
                for (const recipeItem of recipeItems) {
                  addRequirement(
                    recipeItem.materialId,
                    recipeItem.quantity.mul(item.qty),
                  );
                }
              }

              const attributes = item.attributes;
              if (
                attributes &&
                typeof attributes === 'object' &&
                !Array.isArray(attributes) &&
                'toppings' in attributes &&
                Array.isArray(attributes.toppings)
              ) {
                for (const toppingId of attributes.toppings) {
                  if (typeof toppingId === 'string') {
                    addRequirement(toppingId, new Prisma.Decimal(item.qty));
                  }
                }
              }
            }

            const alerts: Array<{
              inventoryId: string;
              branchId: string;
              materialId: string;
              currentStock: number;
              minStock: number;
            }> = [];

            for (const materialId of [...requiredMaterials.keys()].sort()) {
              const quantity = requiredMaterials.get(
                materialId,
              ) as Prisma.Decimal;
              const inventories = await tx.$queryRaw<
                Array<{
                  id: string;
                  current_stock: Prisma.Decimal;
                  min_stock: Prisma.Decimal;
                }>
              >`
              SELECT id, current_stock, min_stock
              FROM inventories
              WHERE branch_id = ${order.branchId} AND material_id = ${materialId}
              FOR UPDATE
            `;
              if (inventories.length !== 1) {
                throw new BadRequestException(
                  `Inventory is not configured for material ${materialId}`,
                );
              }

              const inventory = inventories[0];
              const newStock = new Prisma.Decimal(inventory.current_stock).sub(
                quantity,
              );
              if (newStock.lt(0)) {
                throw new BadRequestException(
                  `Insufficient stock for material ${materialId}`,
                );
              }

              await tx.inventory.update({
                where: { id: inventory.id },
                data: { currentStock: newStock },
              });
              await tx.stockLedger.create({
                data: {
                  branchId: order.branchId,
                  materialId,
                  inventoryId: inventory.id,
                  changeQty: quantity.negated(),
                  balanceAfter: newStock,
                  refType: StockRefType.ORDER,
                  refId: orderId,
                  createdBy: actor.userId,
                  note: `POS Checkout Order ${order.orderNumber}`,
                },
              });

              if (newStock.lt(new Prisma.Decimal(inventory.min_stock))) {
                alerts.push({
                  inventoryId: inventory.id,
                  branchId: order.branchId,
                  materialId,
                  currentStock: newStock.toNumber(),
                  minStock: Number(inventory.min_stock),
                });
              }
            }

            let pointsEarned = 0;
            if (order.customerId) {
              pointsEarned = vnd(order.totalAmount)
                .div(10_000)
                .floor()
                .toNumber();
              await tx.customer.update({
                where: { id: order.customerId },
                data: { totalPoints: { increment: pointsEarned } },
              });
              await tx.pointTransaction.create({
                data: {
                  customerId: order.customerId,
                  points: pointsEarned,
                  reason: `Order ${order.orderNumber}`,
                  refId: order.id,
                },
              });
            }

            await tx.payment.create({
              data: {
                orderId,
                method: PaymentMethod.CASH,
                amount: order.totalAmount,
                status: PaymentStatus.COMPLETED,
                paidAt: new Date(),
              },
            });
            await tx.order.update({
              where: { id: orderId },
              data: { status: OrderStatus.PAID, pointsEarned },
            });

            const completedOrder = await tx.order.findUnique({
              where: { id: orderId },
              include: { items: true, payments: true },
            });
            if (!completedOrder)
              throw new NotFoundException('Completed order not found');

            await this.audit.record(tx, {
              actorId: actor.userId,
              branchId: order.branchId,
              action: 'POS.CHECKOUT',
              resourceType: 'Order',
              resourceId: order.id,
              metadata: {
                orderNumber: order.orderNumber,
                paymentMethod: PaymentMethod.CASH,
                totalAmount: order.totalAmount.toString(),
                pointsEarned,
              },
              correlationId,
            });

            for (const alert of alerts) {
              await this.outbox.enqueue(tx, {
                aggregateType: 'Inventory',
                aggregateId: alert.inventoryId,
                eventType: 'inventory.low_stock',
                payload: {
                  branchId: alert.branchId,
                  materialId: alert.materialId,
                  currentStock: alert.currentStock,
                  minStock: alert.minStock,
                },
                correlationId,
              });
            }

            const response = toOrderResponse(completedOrder);
            await this.idempotency.complete(
              tx,
              idempotencyRecord.id,
              this.idempotency.toJson(response),
              'Order',
              order.id,
            );
            return response;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const uniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';
        if (uniqueConflict) {
          const replay = await this.idempotency.resolveExisting(
            identity,
            requestHash,
          );
          if (replay.found) return replay.responseBody;
        }
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (!retryable || attempt === 3) throw error;
      }
    }

    throw new BadRequestException('Checkout could not be completed');
  }

  async cancelOrder(id: string, actor: AuthenticatedActor, reason?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { stockLedgers: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      assertBranchScope(actor, order.branchId);
      if (order.status === OrderStatus.CANCELLED)
        throw new BadRequestException('Order already cancelled');

      const cancelNote = reason ? `HỦY ĐƠN: ${reason}` : 'HỦY ĐƠN HÀNG';

      // Update status and note
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          note: order.note ? `${order.note} | ${cancelNote}` : cancelNote,
        },
      });

      if (order.status === OrderStatus.PAID) {
        // Reverse inventory
        for (const ledger of order.stockLedgers) {
          if (ledger.changeQty.lt(0)) {
            const refundQty = ledger.changeQty.mul(-1);

            const inventories = await tx.$queryRawUnsafe<any[]>(
              `SELECT * FROM inventories WHERE id = $1 FOR UPDATE`,
              ledger.inventoryId,
            );

            if (inventories && inventories.length > 0) {
              const inv = inventories[0];
              const newStock = new Prisma.Decimal(inv.current_stock).add(
                refundQty,
              );

              await tx.inventory.update({
                where: { id: inv.id },
                data: { currentStock: newStock },
              });

              await tx.stockLedger.create({
                data: {
                  branchId: ledger.branchId,
                  materialId: ledger.materialId,
                  inventoryId: inv.id,
                  changeQty: refundQty,
                  balanceAfter: newStock,
                  refType: StockRefType.ORDER,
                  refId: order.id,
                  createdBy: actor.userId,
                  note: `Hoàn kho do hủy đơn (${reason || 'Không nêu lý do'})`,
                },
              });
            }
          }
        }

        // Reverse points
        if (order.customerId && order.pointsEarned > 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { totalPoints: { decrement: order.pointsEarned } },
          });

          await tx.pointTransaction.create({
            data: {
              customerId: order.customerId,
              points: -order.pointsEarned,
              reason: `Order ${order.orderNumber} Cancelled`,
              refId: order.id,
            },
          });
        }
      }

      return { success: true, message: 'Order cancelled successfully' };
    });
  }

  async findAll(query: QueryOrderDto) {
    const {
      page,
      limit,
      skip,
      take,
      branchId,
      status,
      startDate,
      endDate,
      cashierId,
      search,
    } = query;

    const where: Prisma.OrderWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (cashierId) where.cashierId = cashierId;
    if (startDate || endDate) {
      where.createdAt = businessTimestampRange(startDate, endDate);
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { phone: { contains: search } } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true, phone: true } },
          cashier: { select: { fullName: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, type: true } },
              size: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: items.map(toOrderResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit ?? 20)),
      },
    };
  }

  async findOne(id: string, actor?: AuthenticatedActor) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            size: true,
          },
        },
        payments: true,
        customer: true,
        cashier: { select: { id: true, fullName: true } },
        promotion: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (actor) {
      assertBranchScope(actor, order.branchId, [
        Role.SUPER_ADMIN,
        Role.ACCOUNTANT,
      ]);
    }
    return toOrderResponse(order);
  }

  async addMissingItem(
    orderId: string,
    itemDto: any,
    actor: AuthenticatedActor,
    note?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      assertBranchScope(actor, order.branchId);

      // Product lookup
      const product = await tx.product.findUnique({
        where: { id: itemDto.productId },
      });
      if (!product || !product.isActive) {
        throw new BadRequestException('Product not found or inactive');
      }

      let unitPrice = vnd(product.basePrice);
      if (itemDto.sizeId) {
        const size = await tx.productSize.findUnique({
          where: { id: itemDto.sizeId },
        });
        if (size) unitPrice = addVnd(unitPrice, size.priceAdj);
      }

      let toppingsCost = vnd(0);
      if (
        itemDto.attributes?.toppings &&
        itemDto.attributes.toppings.length > 0
      ) {
        for (const tid of itemDto.attributes.toppings) {
          const top = await tx.product.findUnique({ where: { id: tid } });
          if (top) toppingsCost = addVnd(toppingsCost, top.basePrice);
        }
      }
      unitPrice = addVnd(unitPrice, toppingsCost);
      const itemSubtotal = multiplyVnd(unitPrice, itemDto.qty || 1);

      // Create new OrderItem marked as compensated/added by manager
      const newItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: itemDto.productId,
          sizeId: itemDto.sizeId || null,
          qty: itemDto.qty || 1,
          unitPrice,
          subtotal: itemSubtotal,
          attributes: {
            ...(itemDto.attributes || {}),
            isCompensated: true,
            addedByManager: actor.userId,
            managerNote: note || 'Bổ sung món thiếu theo yêu cầu khách',
          },
        },
      });

      // Update Order note
      const appendNote = `[Bổ sung món thiếu: ${product.name} x${itemDto.qty || 1}${note ? ` - ${note}` : ''}]`;
      await tx.order.update({
        where: { id: orderId },
        data: {
          note: order.note ? `${order.note} | ${appendNote}` : appendNote,
        },
      });

      return {
        success: true,
        message: 'Đã bổ sung món thiếu vào hóa đơn thành công',
        item: newItem,
      };
    });
  }
}
