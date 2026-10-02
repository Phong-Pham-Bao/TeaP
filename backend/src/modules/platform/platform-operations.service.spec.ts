import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboxStatus, Role } from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { AuditService } from './audit.service';
import { PlatformOperationsService } from './platform-operations.service';

const superAdmin: AuthenticatedActor = {
  userId: 'admin-1',
  email: 'admin@example.test',
  role: Role.SUPER_ADMIN,
  branchId: null,
  allowedBranchIds: [],
  sessionId: 'session-1',
};

describe('PlatformOperationsService', () => {
  it('denies non-super-admin callers even when invoked outside the controller', async () => {
    const service = new PlatformOperationsService(
      {} as never,
      {} as AuditService,
      new ConfigService(),
    );
    const manager = { ...superAdmin, role: Role.MANAGER };

    await expect(service.getMetrics(manager)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('replays only a locked dead-letter and audits the operator reason', async () => {
    const event = {
      id: 'event-1',
      status: OutboxStatus.DEAD_LETTER,
      eventType: 'inventory.low_stock',
      aggregateType: 'Inventory',
      aggregateId: 'inventory-1',
      attempts: 10,
    };
    const replayed = {
      id: event.id,
      status: OutboxStatus.PENDING,
      attempts: 0,
      availableAt: new Date(),
    };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: event.id }]),
      outboxEvent: {
        findUnique: jest.fn().mockResolvedValue(event),
        update: jest.fn().mockResolvedValue(replayed),
      },
    };
    const prisma = {
      $transaction: jest.fn((operation) => operation(tx)),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new PlatformOperationsService(
      prisma as never,
      audit as unknown as AuditService,
      new ConfigService(),
    );

    await expect(
      service.replayDeadLetter(
        event.id,
        'Đã sửa cấu hình consumer',
        superAdmin,
        'correlation-1',
      ),
    ).resolves.toEqual(replayed);
    expect(tx.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: event.id },
        data: expect.objectContaining({
          status: OutboxStatus.PENDING,
          attempts: 0,
          lastError: null,
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'PLATFORM.OUTBOX_REPLAYED',
        reason: 'Đã sửa cấu hình consumer',
        correlationId: 'correlation-1',
      }),
    );
  });

  it('deletes only bounded eligible batches and records cleanup evidence', async () => {
    const tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'audit-1' }, { id: 'audit-2' }])
        .mockResolvedValueOnce([{ id: 'idempotency-1' }])
        .mockResolvedValueOnce([{ id: 'outbox-1' }]),
    };
    const prisma = {
      $transaction: jest.fn((operation) => operation(tx)),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new PlatformOperationsService(
      prisma as never,
      audit as unknown as AuditService,
      new ConfigService({
        AUDIT_RETENTION_DAYS: '365',
        OUTBOX_PUBLISHED_RETENTION_DAYS: '30',
        IDEMPOTENCY_RETENTION_GRACE_DAYS: '7',
      }),
    );

    const result = await service.runRetentionCleanup(
      { reason: 'Đợt dọn dữ liệu định kỳ', batchSize: 100 },
      superAdmin,
      'correlation-2',
    );

    expect(result).toEqual({
      deletedAuditEvents: 2,
      deletedIdempotencyRecords: 1,
      deletedPublishedOutboxEvents: 1,
      batchSize: 100,
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'PLATFORM.RETENTION_CLEANUP',
        reason: 'Đợt dọn dữ liệu định kỳ',
        metadata: expect.objectContaining(result),
      }),
    );
  });
});
