import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class QueryDeadLettersDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

export class ReplayOutboxDto {
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}

export class RunRetentionCleanupDto {
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5000, default: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  batchSize = 500;
}

export class PlatformMetricsResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'integer' },
  })
  outboxByStatus: Record<string, number>;

  @ApiProperty()
  actionableBacklog: number;

  @ApiProperty()
  deadLetterCount: number;

  @ApiProperty({ type: 'integer', nullable: true })
  oldestActionableAgeSeconds: number | null;

  @ApiProperty({ type: 'integer', nullable: true })
  oldestDeadLetterAgeSeconds: number | null;

  @ApiProperty({ format: 'date-time' })
  measuredAt: string;
}

export class DeadLetterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  aggregateType: string;

  @ApiProperty()
  aggregateId: string;

  @ApiProperty()
  eventType: string;

  @ApiProperty()
  attempts: number;

  @ApiProperty({ type: 'string', nullable: true })
  lastError: string | null;

  @ApiProperty()
  correlationId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class DeadLetterPageResponseDto {
  @ApiProperty({ type: [DeadLetterResponseDto] })
  data: DeadLetterResponseDto[];

  @ApiProperty({ type: 'string', nullable: true, format: 'uuid' })
  nextCursor: string | null;
}

export class ReplayOutboxResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty()
  attempts: number;

  @ApiProperty({ format: 'date-time' })
  availableAt: Date;
}

export class RetentionCleanupResponseDto {
  @ApiProperty()
  deletedAuditEvents: number;

  @ApiProperty()
  deletedIdempotencyRecords: number;

  @ApiProperty()
  deletedPublishedOutboxEvents: number;

  @ApiProperty()
  batchSize: number;
}
