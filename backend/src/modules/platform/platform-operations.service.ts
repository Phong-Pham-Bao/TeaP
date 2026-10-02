import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboxStatus, Prisma, Role } from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import {
  QueryDeadLettersDto,
  RunRetentionCleanupDto,
} from './dto/platform-operations.dto';

const DAY_MS = 86_400_000;
const ACTIONABLE_OUTBOX_STATUSES: readonly OutboxStatus[] = [
  OutboxStatus.PENDING,
  OutboxStatus.FAILED,
  OutboxStatus.PROCESSING,
];

@Injectable()
export class PlatformOperationsService {
  private readonly auditRetentionDays: number;
  private readonly outboxRetentionDays: number;
  private readonly idempotencyGraceDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.auditRetentionDays = this.readDays(
      config,
      'AUDIT_RETENTION_DAYS',
      365,
      30,
    );
    this.outboxRetentionDays = this.readDays(
      config,
      'OUTBOX_PUBLISHED_RETENTION_DAYS',
      30,
      1,
    );
    this.idempotencyGraceDays = this.readDays(
      config,
      'IDEMPOTENCY_RETENTION_GRACE_DAYS',
      7,
      0,
    );
  }

  async getMetrics(actor: AuthenticatedActor) {
    this.assertPlatformOperator(actor);
    const measuredAt = new Date();
    const [groups, oldestActionable, oldestDeadLetter] = await Promise.all([
      this.prisma.outboxEvent.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.outboxEvent.findFirst({
        where: { status: { in: [...ACTIONABLE_OUTBOX_STATUSES] } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { createdAt: true },
      }),
      this.prisma.outboxEvent.findFirst({
        where: { status: OutboxStatus.DEAD_LETTER },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { createdAt: true },
      }),
    ]);

    const outboxByStatus = Object.fromEntries(
      Object.values(OutboxStatus).map((status) => [status, 0]),
    ) as Record<OutboxStatus, number>;
    for (const group of groups) {
      outboxByStatus[group.status] = group._count._all;
    }

    return {
      outboxByStatus,
      actionableBacklog: ACTIONABLE_OUTBOX_STATUSES.reduce(
        (sum, status) => sum + outboxByStatus[status],
        0,
      ),
      deadLetterCount: outboxByStatus[OutboxStatus.DEAD_LETTER],
      oldestActionableAgeSeconds: this.ageSeconds(
        oldestActionable?.createdAt,
        measuredAt,
      ),
      oldestDeadLetterAgeSeconds: this.ageSeconds(
        oldestDeadLetter?.createdAt,
        measuredAt,
      ),
      measuredAt: measuredAt.toISOString(),
    };
  }

  async findDeadLetters(query: QueryDeadLettersDto, actor: AuthenticatedActor) {
    this.assertPlatformOperator(actor);
    const cursor = query.cursor
      ? await this.prisma.outboxEvent.findUnique({
          where: { id: query.cursor },
          select: { id: true, status: true, createdAt: true },
        })
      : null;
    if (
      query.cursor &&
      (!cursor || cursor.status !== OutboxStatus.DEAD_LETTER)
    ) {
      throw new BadRequestException('Dead-letter cursor is invalid');
    }

    const rows = await this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.DEAD_LETTER,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: {
        id: true,
        aggregateType: true,
        aggregateId: true,
        eventType: true,
        attempts: true,
        lastError: true,
        correlationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const hasMore = rows.length > query.limit;
    const data = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async replayDeadLetter(
    eventId: string,
    reason: string,
    actor: AuthenticatedActor,
    correlationId: string,
  ) {
    this.assertPlatformOperator(actor);
    const normalizedReason = reason.trim();
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM outbox_events
        WHERE id = ${eventId}
        FOR UPDATE
      `;
      const event = await tx.outboxEvent.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Outbox event not found');
      if (event.status !== OutboxStatus.DEAD_LETTER) {
        throw new ConflictException('Only dead-letter events can be replayed');
      }

      const replayed = await tx.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: OutboxStatus.PENDING,
          attempts: 0,
          availableAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          publishedAt: null,
          lastError: null,
        },
        select: { id: true, status: true, attempts: true, availableAt: true },
      });
      await this.audit.record(tx, {
        actorId: actor.userId,
        branchId: actor.branchId || undefined,
        action: 'PLATFORM.OUTBOX_REPLAYED',
        resourceType: 'OutboxEvent',
        resourceId: event.id,
        reason: normalizedReason,
        metadata: {
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          previousAttempts: event.attempts,
        },
        correlationId,
      });
      return replayed;
    });
  }

  async runRetentionCleanup(
    input: RunRetentionCleanupDto,
    actor: AuthenticatedActor,
    correlationId: string,
  ) {
    this.assertPlatformOperator(actor);
    const now = Date.now();
    const auditCutoff = new Date(now - this.auditRetentionDays * DAY_MS);
    const outboxCutoff = new Date(now - this.outboxRetentionDays * DAY_MS);
    const idempotencyCutoff = new Date(
      now - this.idempotencyGraceDays * DAY_MS,
    );

    return this.prisma.$transaction(async (tx) => {
      const deletedAudit = await tx.$queryRaw<Array<{ id: string }>>`
        WITH candidates AS (
          SELECT id
          FROM audit_events
          WHERE created_at < ${auditCutoff}
          ORDER BY created_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT ${input.batchSize}
        )
        DELETE FROM audit_events AS event
        USING candidates
        WHERE event.id = candidates.id
        RETURNING event.id
      `;
      const deletedIdempotency = await tx.$queryRaw<Array<{ id: string }>>`
        WITH candidates AS (
          SELECT id
          FROM idempotency_records
          WHERE status = 'COMPLETED'
            AND expires_at < ${idempotencyCutoff}
          ORDER BY expires_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT ${input.batchSize}
        )
        DELETE FROM idempotency_records AS record
        USING candidates
        WHERE record.id = candidates.id
        RETURNING record.id
      `;
      const deletedOutbox = await tx.$queryRaw<Array<{ id: string }>>`
        WITH candidates AS (
          SELECT id
          FROM outbox_events
          WHERE status = 'PUBLISHED'
            AND published_at < ${outboxCutoff}
          ORDER BY published_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT ${input.batchSize}
        )
        DELETE FROM outbox_events AS event
        USING candidates
        WHERE event.id = candidates.id
        RETURNING event.id
      `;

      const result = {
        deletedAuditEvents: deletedAudit.length,
        deletedIdempotencyRecords: deletedIdempotency.length,
        deletedPublishedOutboxEvents: deletedOutbox.length,
        batchSize: input.batchSize,
      };
      await this.audit.record(tx, {
        actorId: actor.userId,
        branchId: actor.branchId || undefined,
        action: 'PLATFORM.RETENTION_CLEANUP',
        resourceType: 'PlatformRetention',
        reason: input.reason.trim(),
        metadata: {
          ...result,
          auditCutoff: auditCutoff.toISOString(),
          idempotencyCutoff: idempotencyCutoff.toISOString(),
          outboxCutoff: outboxCutoff.toISOString(),
        },
        correlationId,
      });
      return result;
    });
  }

  private assertPlatformOperator(actor: AuthenticatedActor): void {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Platform operations require SUPER_ADMIN');
    }
  }

  private readDays(
    config: ConfigService,
    key: string,
    fallback: number,
    minimum: number,
  ): number {
    const value = Number(config.get<string>(key) ?? fallback);
    if (!Number.isInteger(value) || value < minimum || value > 3650) {
      throw new Error(`${key} must be an integer between ${minimum} and 3650`);
    }
    return value;
  }

  private ageSeconds(createdAt: Date | undefined, measuredAt: Date) {
    if (!createdAt) return null;
    return Math.max(
      0,
      Math.floor((measuredAt.getTime() - createdAt.getTime()) / 1000),
    );
  }
}
