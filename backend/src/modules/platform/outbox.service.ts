import { Injectable } from '@nestjs/common';
import { OutboxStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface EnqueueOutboxEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  correlationId: string;
}

export interface ClaimedOutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.JsonValue;
  attempts: number;
  correlationId: string;
}

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  enqueue(tx: Prisma.TransactionClient, event: EnqueueOutboxEvent) {
    return tx.outboxEvent.create({ data: event });
  }

  claimBatch(workerId: string, limit = 20): Promise<ClaimedOutboxEvent[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    return this.prisma.$transaction(
      (tx) => tx.$queryRaw<ClaimedOutboxEvent[]>`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE (
          (status IN ('PENDING', 'FAILED') AND available_at <= NOW())
          OR (status = 'PROCESSING' AND locked_at < NOW() - INTERVAL '5 minutes')
        )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${safeLimit}
      )
      UPDATE outbox_events AS event
      SET status = 'PROCESSING',
          attempts = event.attempts + 1,
          locked_at = NOW(),
          locked_by = ${workerId},
          updated_at = NOW()
      FROM candidates
      WHERE event.id = candidates.id
      RETURNING event.id,
                event.aggregate_type AS "aggregateType",
                event.aggregate_id AS "aggregateId",
                event.event_type AS "eventType",
                event.payload,
                event.attempts,
                event.correlation_id AS "correlationId"
    `,
    );
  }

  async markPublished(id: string, workerId: string): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: { id, status: OutboxStatus.PROCESSING, lockedBy: workerId },
      data: {
        status: OutboxStatus.PUBLISHED,
        publishedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });
  }

  async markFailed(
    id: string,
    workerId: string,
    attempts: number,
    error: unknown,
  ): Promise<{ updated: boolean; deadLetter: boolean }> {
    const deadLetter = attempts >= 10;
    const delaySeconds = Math.min(2 ** Math.min(attempts, 10), 3600);
    const result = await this.prisma.outboxEvent.updateMany({
      where: { id, status: OutboxStatus.PROCESSING, lockedBy: workerId },
      data: {
        status: deadLetter ? OutboxStatus.DEAD_LETTER : OutboxStatus.FAILED,
        availableAt: new Date(Date.now() + delaySeconds * 1000),
        lockedAt: null,
        lockedBy: null,
        lastError: String(error).slice(0, 1000),
      },
    });
    return { updated: result.count === 1, deadLetter };
  }
}
