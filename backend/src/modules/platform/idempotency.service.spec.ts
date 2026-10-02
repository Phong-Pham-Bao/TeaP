import { BadRequestException, ConflictException } from '@nestjs/common';
import { IdempotencyStatus } from '@prisma/client';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  const config = { get: jest.fn().mockReturnValue(undefined) };

  it('requires a safe Idempotency-Key', () => {
    const service = new IdempotencyService({} as never, config as never);
    expect(() => service.validateKey(undefined)).toThrow(BadRequestException);
    expect(() => service.validateKey('short')).toThrow(BadRequestException);
    expect(service.validateKey('checkout-key-123')).toBe('checkout-key-123');
  });

  it('hashes semantically identical objects consistently', () => {
    const service = new IdempotencyService({} as never, config as never);
    expect(service.hashRequest({ amount: 100, orderId: '1' })).toBe(
      service.hashRequest({ orderId: '1', amount: 100 }),
    );
  });

  it('returns the original completed response for a replay', async () => {
    const prisma = {
      idempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash: 'same-hash',
          status: IdempotencyStatus.COMPLETED,
          responseStatus: 200,
          responseBody: { id: 'order-1', status: 'PAID' },
        }),
      },
    };
    const service = new IdempotencyService(prisma as never, config as never);

    await expect(
      service.resolveExisting(
        {
          actorId: 'user-1',
          scopeKey: 'branch-a',
          action: 'POS_CHECKOUT',
          key: 'checkout-key-123',
        },
        'same-hash',
      ),
    ).resolves.toEqual({
      found: true,
      responseStatus: 200,
      responseBody: { id: 'order-1', status: 'PAID' },
    });
  });

  it('rejects reuse of a key with another payload', async () => {
    const prisma = {
      idempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash: 'original-hash',
          status: IdempotencyStatus.COMPLETED,
          responseStatus: 200,
          responseBody: { id: 'order-1' },
        }),
      },
    };
    const service = new IdempotencyService(prisma as never, config as never);

    await expect(
      service.resolveExisting(
        {
          actorId: 'user-1',
          scopeKey: 'branch-a',
          action: 'POS_CHECKOUT',
          key: 'checkout-key-123',
        },
        'different-hash',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
