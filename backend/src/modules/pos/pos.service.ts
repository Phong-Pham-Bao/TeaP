import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderStatus, PaymentStatus, StockRefType, Prisma, ProductType } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('inventory-alerts') private inventoryAlertQueue: Queue
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `ORD-${yy}${mm}${dd}-${random}`;
  }

  async createOrder(dto: CreateOrderDto, cashierId: string) {
    let subtotal = new Prisma.Decimal(0);
    const orderItemsData: any[] = [];

    // 1. Validate all products & calculate prices
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${item.productId} not found or inactive`);
      }

      let unitPrice = new Prisma.Decimal(product.basePrice);

      // Check size
      if (item.sizeId) {
        const size = await this.prisma.productSize.findUnique({
          where: { id: item.sizeId }
        });
        if (!size || size.productId !== product.id) {
          throw new BadRequestException(`Invalid size for product ${product.name}`);
        }
        unitPrice = unitPrice.add(new Prisma.Decimal(size.priceAdj));
      }

      // Check toppings
      let toppingsCost = new Prisma.Decimal(0);
      if (item.attributes?.toppings && item.attributes.toppings.length > 0) {
        for (const toppingId of item.attributes.toppings) {
          const topping = await this.prisma.product.findUnique({ where: { id: toppingId } });
          if (!topping || topping.type !== ProductType.TOPPING) {
            throw new BadRequestException(`Invalid topping ID: ${toppingId}`);
          }
          toppingsCost = toppingsCost.add(new Prisma.Decimal(topping.basePrice));
        }
      }

      unitPrice = unitPrice.add(toppingsCost);
      const itemSubtotal = unitPrice.mul(new Prisma.Decimal(item.qty));
      subtotal = subtotal.add(itemSubtotal);

      orderItemsData.push({
        productId: item.productId,
        sizeId: item.sizeId,
        qty: item.qty,
        unitPrice: unitPrice,
        subtotal: itemSubtotal,
        attributes: item.attributes || Prisma.JsonNull,
      });
    }

    // 2. Promotions
    let discount = new Prisma.Decimal(0);
    if (dto.promotionId) {
      const promo = await this.prisma.promotion.findUnique({ where: { id: dto.promotionId } });
      const now = new Date();
      if (!promo || !promo.isActive || promo.startDate > now || promo.endDate < now) {
        throw new BadRequestException('Invalid or expired promotion');
      }
      if (promo.minOrderValue && subtotal.lt(promo.minOrderValue)) {
        throw new BadRequestException('Minimum order value for promotion not met');
      }

      if (promo.type === 'PERCENTAGE') {
        let calcDiscount = subtotal.mul(promo.value).div(100);
        if (promo.maxDiscount && calcDiscount.gt(promo.maxDiscount)) {
          calcDiscount = new Prisma.Decimal(promo.maxDiscount);
        }
        discount = calcDiscount;
      } else if (promo.type === 'FIXED_AMOUNT') {
        discount = new Prisma.Decimal(promo.value);
      }
      // BUY_X_GET_Y requires more complex logic, omitted for brevity
    }

    const totalAmount = subtotal.sub(discount);
    if (totalAmount.lt(0)) throw new BadRequestException('Total amount cannot be negative');

    // Generate Order Number
    const orderNumber = this.generateOrderNumber();

    // Create Order Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          orderNumber,
          branchId: dto.branchId,
          cashierId: cashierId,
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
        include: {
          items: true,
        },
      });
    });

    return order;
  }

  async checkout(orderId: string, dto: CheckoutDto, cashierId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Get order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Order already processed');

      // Verify payment amount
      if (new Prisma.Decimal(dto.amountPaid).lt(order.totalAmount)) {
        throw new BadRequestException('Insufficient payment amount');
      }

      // Step 2: Update status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // Step 3: Create payment record
      await tx.payment.create({
        data: {
          orderId,
          method: dto.paymentMethod,
          amount: order.totalAmount,
          status: PaymentStatus.COMPLETED,
          transactionId: dto.transactionId,
          paidAt: new Date(),
        },
      });

      // Step 4: Deduct Inventory with Pessimistic Locking
      const branchId = order.branchId;
      for (const item of order.items) {
        // Collect materials to deduct
        const materialsToDeduct: { materialId: string, quantity: Prisma.Decimal }[] = [];

        if (item.product.type === ProductType.DRINK) {
          // Get recipe items
          const recipeItems = await tx.recipeItem.findMany({
            where: {
              drinkId: item.productId,
              OR: [
                { sizeId: item.sizeId },
                { sizeId: null }
              ]
            }
          });

          for (const ri of recipeItems) {
            materialsToDeduct.push({
              materialId: ri.materialId,
              quantity: ri.quantity.mul(item.qty)
            });
          }
        }

        // Toppings
        if (item.attributes && typeof item.attributes === 'object' && 'toppings' in item.attributes) {
          const toppings = (item.attributes as any).toppings as string[];
          for (const toppingId of toppings) {
            // Usually topping itself is a material or has a recipe
            // For simplicity, assuming topping uses 1 unit of itself in inventory
            materialsToDeduct.push({
              materialId: toppingId,
              quantity: new Prisma.Decimal(item.qty) // 1 * order qty
            });
          }
        }

        // Apply deductions
        for (const deduction of materialsToDeduct) {
          // Pessimistic lock
          const inventories = await tx.$queryRawUnsafe<any[]>(
            `SELECT * FROM inventories WHERE branch_id = $1 AND material_id = $2 FOR UPDATE`,
            branchId, deduction.materialId
          );

          if (inventories && inventories.length > 0) {
            const inv = inventories[0];
            const newStock = new Prisma.Decimal(inv.current_stock).sub(deduction.quantity);

            // Update inventory
            await tx.inventory.update({
              where: { id: inv.id },
              data: { currentStock: newStock }
            });

            // Ledger entry
            await tx.stockLedger.create({
              data: {
                branchId: branchId,
                materialId: deduction.materialId,
                inventoryId: inv.id,
                changeQty: deduction.quantity.mul(-1), // negative for deduction
                balanceAfter: newStock,
                refType: StockRefType.ORDER,
                refId: orderId,
                createdBy: cashierId,
                note: `POS Checkout Order ${order.orderNumber}`
              }
            });

            // Enqueue alert if below minStock
            if (newStock.lt(new Prisma.Decimal(inv.min_stock))) {
              await this.inventoryAlertQueue.add({
                branchId: branchId,
                materialId: deduction.materialId,
                currentStock: newStock.toNumber(),
                minStock: Number(inv.min_stock)
              });
            }
          }
        }
      }

      // Step 5: Points
      let pointsEarned = 0;
      if (order.customerId) {
        pointsEarned = Math.floor(Number(order.totalAmount) / 10000);
        
        await tx.order.update({
          where: { id: orderId },
          data: { pointsEarned }
        });

        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalPoints: { increment: pointsEarned } }
        });

        await tx.pointTransaction.create({
          data: {
            customerId: order.customerId,
            points: pointsEarned,
            reason: `Order ${order.orderNumber}`,
            refId: order.id,
          }
        });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
      });

    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async cancelOrder(id: string, managerId: string, reason?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { stockLedgers: true }
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Order already cancelled');

      const cancelNote = reason ? `HỦY ĐƠN: ${reason}` : 'HỦY ĐƠN HÀNG';

      // Update status and note
      await tx.order.update({
        where: { id },
        data: { 
          status: OrderStatus.CANCELLED,
          note: order.note ? `${order.note} | ${cancelNote}` : cancelNote
        }
      });

      if (order.status === OrderStatus.PAID) {
        // Reverse inventory
        for (const ledger of order.stockLedgers) {
          if (ledger.changeQty.lt(0)) {
            const refundQty = ledger.changeQty.mul(-1);
            
            const inventories = await tx.$queryRawUnsafe<any[]>(
              `SELECT * FROM inventories WHERE id = $1 FOR UPDATE`,
              ledger.inventoryId
            );

            if (inventories && inventories.length > 0) {
              const inv = inventories[0];
              const newStock = new Prisma.Decimal(inv.current_stock).add(refundQty);

              await tx.inventory.update({
                where: { id: inv.id },
                data: { currentStock: newStock }
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
                  createdBy: managerId,
                  note: `Hoàn kho do hủy đơn (${reason || 'Không nêu lý do'})`
                }
              });
            }
          }
        }

        // Reverse points
        if (order.customerId && order.pointsEarned > 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { totalPoints: { decrement: order.pointsEarned } }
          });

          await tx.pointTransaction.create({
            data: {
              customerId: order.customerId,
              points: -order.pointsEarned,
              reason: `Order ${order.orderNumber} Cancelled`,
              refId: order.id,
            }
          });
        }
      }
      
      return { success: true, message: 'Order cancelled successfully' };
    });
  }

  async findAll(query: QueryOrderDto) {
    const { page, limit, skip, take, branchId, status, startDate, endDate, cashierId, search } = query;
    
    const where: Prisma.OrderWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (cashierId) where.cashierId = cashierId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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
        }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit ?? 20))
      }
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            size: true
          }
        },
        payments: true,
        customer: true,
        cashier: { select: { id: true, fullName: true } },
        promotion: true
      }
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async addMissingItem(orderId: string, itemDto: any, managerId: string, note?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('Order not found');

      // Product lookup
      const product = await tx.product.findUnique({ where: { id: itemDto.productId } });
      if (!product || !product.isActive) {
        throw new BadRequestException('Product not found or inactive');
      }

      let unitPrice = new Prisma.Decimal(product.basePrice);
      if (itemDto.sizeId) {
        const size = await tx.productSize.findUnique({ where: { id: itemDto.sizeId } });
        if (size) unitPrice = unitPrice.add(new Prisma.Decimal(size.priceAdj));
      }

      let toppingsCost = new Prisma.Decimal(0);
      if (itemDto.attributes?.toppings && itemDto.attributes.toppings.length > 0) {
        for (const tid of itemDto.attributes.toppings) {
          const top = await tx.product.findUnique({ where: { id: tid } });
          if (top) toppingsCost = toppingsCost.add(new Prisma.Decimal(top.basePrice));
        }
      }
      unitPrice = unitPrice.add(toppingsCost);
      const itemSubtotal = unitPrice.mul(new Prisma.Decimal(itemDto.qty || 1));

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
            addedByManager: managerId,
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
