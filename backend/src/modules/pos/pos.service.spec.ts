import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, Prisma, PromotionType, Role } from '@prisma/client';
import { PosService } from './pos.service';

describe('PosService checkout guardrails', () => {
  const prisma = {} as never;
  const service = new PosService(
    prisma,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const actor = {
    userId: 'cashier-1',
    email: 'cashier@teap.test',
    role: Role.CASHIER,
    branchId: 'branch-a',
    allowedBranchIds: ['branch-a'],
    sessionId: 'session-1',
  };

  it.each([
    PaymentMethod.MOMO,
    PaymentMethod.VNPAY,
    PaymentMethod.BANK_TRANSFER,
  ])('does not mark %s paid without provider verification', async (method) => {
    await expect(
      service.checkout(
        'order-1',
        { paymentMethod: method, amountPaid: 100_000 },
        actor,
        'checkout-key-123',
        'correlation-123',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns a prior response before running checkout side effects', async () => {
    const prismaWithTransaction = { $transaction: jest.fn() };
    const idempotency = {
      validateKey: jest.fn().mockReturnValue('checkout-key-123'),
      hashRequest: jest.fn().mockReturnValue('request-hash'),
      resolveExisting: jest.fn().mockResolvedValue({
        found: true,
        responseStatus: 200,
        responseBody: { id: 'order-1', status: 'PAID' },
      }),
    };
    const replayService = new PosService(
      prismaWithTransaction as never,
      {} as never,
      idempotency as never,
      {} as never,
      {} as never,
    );

    await expect(
      replayService.checkout(
        'order-1',
        { paymentMethod: PaymentMethod.CASH, amountPaid: 100_000 },
        actor,
        'checkout-key-123',
        'correlation-123',
      ),
    ).resolves.toEqual({ id: 'order-1', status: 'PAID' });
    expect(prismaWithTransaction.$transaction).not.toHaveBeenCalled();
  });

  it('returns a prior create-order response before pricing side effects', async () => {
    const prismaWithQueries = {
      product: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    const idempotency = {
      validateKey: jest.fn().mockReturnValue('create-key-123'),
      hashRequest: jest.fn().mockReturnValue('request-hash'),
      resolveExisting: jest.fn().mockResolvedValue({
        found: true,
        responseStatus: 201,
        responseBody: { id: 'order-1', status: 'PENDING' },
      }),
    };
    const replayService = new PosService(
      prismaWithQueries as never,
      {} as never,
      idempotency as never,
      {} as never,
      {} as never,
    );

    await expect(
      replayService.createOrder(
        {
          branchId: 'branch-a',
          items: [
            {
              productId: '1db04ed0-0b2f-4cca-867e-82251641475e',
              qty: 1,
            },
          ],
        },
        actor,
        'create-key-123',
        'correlation-123',
      ),
    ).resolves.toEqual({ id: 'order-1', status: 'PENDING' });
    expect(prismaWithQueries.product.findUnique).not.toHaveBeenCalled();
    expect(prismaWithQueries.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an unsupported promotion instead of silently ignoring it', async () => {
    const prismaWithQueries = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: '1db04ed0-0b2f-4cca-867e-82251641475e',
          name: 'Test drink',
          type: 'DRINK',
          isActive: true,
          basePrice: new Prisma.Decimal(45_000),
        }),
      },
      promotion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'promotion-1',
          type: PromotionType.BUY_X_GET_Y,
          value: new Prisma.Decimal(1),
          minOrderValue: null,
          maxDiscount: null,
          isActive: true,
          startDate: new Date(Date.now() - 60_000),
          endDate: new Date(Date.now() + 60_000),
        }),
      },
      $transaction: jest.fn(),
    };
    const idempotency = {
      validateKey: jest.fn().mockReturnValue('create-key-unsupported-promo'),
      hashRequest: jest.fn().mockReturnValue('request-hash'),
      resolveExisting: jest.fn().mockResolvedValue({ found: false }),
    };
    const pricingService = new PosService(
      prismaWithQueries as never,
      {} as never,
      idempotency as never,
      {} as never,
      {} as never,
    );

    await expect(
      pricingService.createOrder(
        {
          branchId: 'branch-a',
          promotionId: 'promotion-1',
          items: [
            {
              productId: '1db04ed0-0b2f-4cca-867e-82251641475e',
              qty: 1,
            },
          ],
        },
        actor,
        'create-key-unsupported-promo',
        'correlation-123',
      ),
    ).rejects.toThrow('not supported at checkout');
    expect(prismaWithQueries.$transaction).not.toHaveBeenCalled();
  });

  it('allocates the order number inside the transaction and scopes idempotency to the selected branch', async () => {
    const tx = {
      order: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'order-1',
          ...data,
          pointsEarned: 0,
          createdAt: new Date('2026-09-29T10:00:00.000Z'),
          updatedAt: new Date('2026-09-29T10:00:00.000Z'),
          items: [
            {
              id: 'item-1',
              productId: data.items.create[0].productId,
              sizeId: null,
              qty: data.items.create[0].qty,
              unitPrice: data.items.create[0].unitPrice,
              subtotal: data.items.create[0].subtotal,
              attributes: null,
            },
          ],
        })),
      },
    };
    const prismaWithTransaction = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'product-1',
          name: 'Test drink',
          type: 'DRINK',
          isActive: true,
          basePrice: new Prisma.Decimal(45_000),
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const idempotency = {
      validateKey: jest.fn().mockReturnValue('create-key-sequence'),
      hashRequest: jest.fn().mockReturnValue('request-hash'),
      resolveExisting: jest.fn().mockResolvedValue({ found: false }),
      start: jest.fn().mockResolvedValue({ id: 'idempotency-1' }),
      complete: jest.fn().mockResolvedValue(undefined),
      toJson: jest.fn((value) => value),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const documentSequence = {
      next: jest.fn().mockResolvedValue('ORD-260929-000001'),
    };
    const createService = new PosService(
      prismaWithTransaction as never,
      audit as never,
      idempotency as never,
      {} as never,
      documentSequence as never,
    );

    const result = await createService.createOrder(
      {
        branchId: 'branch-b',
        items: [{ productId: 'product-1', qty: 1 }],
      },
      { ...actor, allowedBranchIds: ['branch-a', 'branch-b'] },
      'create-key-sequence',
      'correlation-123',
    );

    expect(idempotency.resolveExisting).toHaveBeenCalledWith(
      expect.objectContaining({ scopeKey: 'branch-b' }),
      'request-hash',
    );
    expect(documentSequence.next).toHaveBeenCalledWith(tx, {
      documentType: 'POS_ORDER',
      prefix: 'ORD',
      branchId: 'branch-b',
    });
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderNumber: 'ORD-260929-000001',
          branchId: 'branch-b',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ orderNumber: 'ORD-260929-000001' }),
    );
  });
});
