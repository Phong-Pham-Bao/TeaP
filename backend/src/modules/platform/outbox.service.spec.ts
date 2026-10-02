import { OutboxStatus } from '@prisma/client';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  it('backs off a failed event without losing it', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = new OutboxService({ outboxEvent: { updateMany } } as never);

    const outcome = await service.markFailed(
      'event-1',
      'worker-1',
      2,
      new Error('temporary'),
    );

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'event-1',
          status: OutboxStatus.PROCESSING,
          lockedBy: 'worker-1',
        },
        data: expect.objectContaining({
          status: OutboxStatus.FAILED,
          lockedAt: null,
          lockedBy: null,
        }),
      }),
    );
    expect(outcome).toEqual({ updated: true, deadLetter: false });
  });

  it('dead-letters an event after the retry ceiling', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = new OutboxService({ outboxEvent: { updateMany } } as never);

    const outcome = await service.markFailed(
      'event-1',
      'worker-1',
      10,
      'permanent',
    );

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OutboxStatus.DEAD_LETTER }),
      }),
    );
    expect(outcome).toEqual({ updated: true, deadLetter: true });
  });
});
