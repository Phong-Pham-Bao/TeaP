import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ClaimedOutboxEvent, OutboxService } from './outbox.service';

interface LowStockPayload {
  branchId: string;
  materialId: string;
}

@Injectable()
export class OutboxWorkerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(OutboxWorkerService.name);
  private readonly workerId = `outbox-${randomUUID()}`;
  private readonly pollMs: number;
  private readonly enabled: boolean;
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.enabled =
      configService.get<string>('OUTBOX_WORKER_ENABLED') !== 'false';
    this.pollMs = Number(configService.get<string>('OUTBOX_POLL_MS') || '5000');
    if (!Number.isInteger(this.pollMs) || this.pollMs < 1000) {
      throw new Error('OUTBOX_POLL_MS must be an integer of at least 1000');
    }
  }

  onApplicationBootstrap(): void {
    if (!this.enabled) return;
    this.schedule(0);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(delay: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), delay);
    this.timer.unref();
  }

  private async tick(): Promise<void> {
    try {
      const events = await this.outbox.claimBatch(this.workerId);
      for (const event of events) await this.process(event);
    } catch (error) {
      this.logger.error(`Outbox poll failed: ${String(error)}`);
    } finally {
      this.schedule(this.pollMs);
    }
  }

  private async process(event: ClaimedOutboxEvent): Promise<void> {
    try {
      if (event.eventType === 'inventory.low_stock') {
        await this.handleLowStock(event.payload);
      } else {
        throw new Error(`No outbox handler registered for ${event.eventType}`);
      }
      await this.outbox.markPublished(event.id, this.workerId);
    } catch (error) {
      this.logger.warn(
        `Outbox event ${event.id} failed on attempt ${event.attempts}: ${String(error)}`,
      );
      const outcome = await this.outbox.markFailed(
        event.id,
        this.workerId,
        event.attempts,
        error,
      );
      if (outcome.updated && outcome.deadLetter) {
        this.logger.error(
          `[OUTBOX_DEAD_LETTER] event=${event.id} type=${event.eventType} correlation=${event.correlationId}`,
        );
      }
    }
  }

  private async handleLowStock(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid inventory.low_stock payload');
    }
    const { branchId, materialId } = payload as unknown as LowStockPayload;
    if (typeof branchId !== 'string' || typeof materialId !== 'string') {
      throw new Error('Invalid inventory.low_stock identifiers');
    }
    const inventory = await this.prisma.inventory.findUnique({
      where: { branchId_materialId: { branchId, materialId } },
      include: { branch: true, material: true },
    });
    if (inventory && inventory.currentStock.lt(inventory.minStock)) {
      this.logger.warn(
        `[INVENTORY ALERT] Branch ${inventory.branch.name} - Material ${inventory.material.name} is low on stock. Current: ${inventory.currentStock}, Min: ${inventory.minStock}`,
      );
    }
  }
}
