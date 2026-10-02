import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type RateLimitResult = { count: number };

@Injectable()
export class AuthThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async consume(key: string, limit: number, windowMs: number): Promise<void> {
    const keyHash = createHash('sha256').update(key).digest('hex');
    const [result] = await this.prisma.$queryRaw<RateLimitResult[]>`
      INSERT INTO "auth_rate_limits" (
        "key_hash", "count", "reset_at", "updated_at"
      )
      VALUES (
        ${keyHash},
        1,
        CURRENT_TIMESTAMP + (${windowMs} * INTERVAL '1 millisecond'),
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("key_hash") DO UPDATE SET
        "count" = CASE
          WHEN "auth_rate_limits"."reset_at" <= CURRENT_TIMESTAMP THEN 1
          ELSE "auth_rate_limits"."count" + 1
        END,
        "reset_at" = CASE
          WHEN "auth_rate_limits"."reset_at" <= CURRENT_TIMESTAMP
            THEN EXCLUDED."reset_at"
          ELSE "auth_rate_limits"."reset_at"
        END,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "count"
    `;

    if (result.count > limit) {
      throw new HttpException(
        'Too many authentication attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
