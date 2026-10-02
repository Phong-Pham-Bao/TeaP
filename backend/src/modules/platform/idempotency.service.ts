import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdempotencyStatus, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

interface IdempotencyIdentity {
  actorId: string;
  scopeKey: string;
  action: string;
  key: string;
}

interface StartIdempotency extends IdempotencyIdentity {
  requestHash: string;
}

export type ExistingIdempotency =
  | { found: false }
  | { found: true; responseStatus: number; responseBody: Prisma.JsonValue };

const SAFE_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

@Injectable()
export class IdempotencyService {
  private readonly ttlHours: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.ttlHours = Number(configService.get<string>('IDEMPOTENCY_TTL_HOURS') || '24');
    if (!Number.isInteger(this.ttlHours) || this.ttlHours < 1 || this.ttlHours > 168) {
      throw new Error('IDEMPOTENCY_TTL_HOURS must be an integer between 1 and 168');
    }
  }

  validateKey(key: string | undefined): string {
    if (!key || !SAFE_KEY.test(key)) {
      throw new BadRequestException(
        'Idempotency-Key is required and must contain 8-128 safe characters',
      );
    }
    return key;
  }

  hashRequest(payload: unknown): string {
    return createHash('sha256').update(this.stableStringify(payload)).digest('hex');
  }

  async resolveExisting(
    identity: IdempotencyIdentity,
    requestHash: string,
  ): Promise<ExistingIdempotency> {
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        actorId_scopeKey_action_key: identity,
      },
    });
    if (!existing) return { found: false };
    if (existing.requestHash !== requestHash) {
      throw new ConflictException('Idempotency-Key was already used with another request');
    }
    if (
      existing.status !== IdempotencyStatus.COMPLETED ||
      existing.responseStatus === null ||
      existing.responseBody === null
    ) {
      throw new ConflictException('An operation with this Idempotency-Key is still processing');
    }
    return {
      found: true,
      responseStatus: existing.responseStatus,
      responseBody: existing.responseBody,
    };
  }

  start(tx: Prisma.TransactionClient, input: StartIdempotency) {
    return tx.idempotencyRecord.create({
      data: {
        ...input,
        expiresAt: new Date(Date.now() + this.ttlHours * 3_600_000),
      },
    });
  }

  complete(
    tx: Prisma.TransactionClient,
    id: string,
    responseBody: Prisma.InputJsonValue,
    resourceType: string,
    resourceId: string,
    responseStatus = 200,
  ) {
    return tx.idempotencyRecord.update({
      where: { id },
      data: {
        status: IdempotencyStatus.COMPLETED,
        responseStatus,
        responseBody,
        resourceType,
        resourceId,
      },
    });
  }

  toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private stableStringify(value: unknown): string {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value) || 'null';
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`)
      .join(',')}}`;
  }
}
