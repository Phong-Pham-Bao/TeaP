import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  businessDateColumn,
  businessDateKey,
} from '../../common/time/business-time';

export interface NextDocumentNumberInput {
  documentType: string;
  prefix: string;
  branchId: string;
  now?: Date;
}

interface SequenceRow {
  lastValue: number;
}

@Injectable()
export class DocumentSequenceService {
  async next(
    tx: Prisma.TransactionClient,
    input: NextDocumentNumberInput,
  ): Promise<string> {
    const businessDate = businessDateKey(input.now ?? new Date());
    const rows = await tx.$queryRaw<SequenceRow[]>(Prisma.sql`
      INSERT INTO "document_sequences" (
        "id",
        "document_type",
        "branch_id",
        "business_date",
        "last_value",
        "created_at",
        "updated_at"
      ) VALUES (
        ${randomUUID()},
        ${input.documentType},
        ${input.branchId},
        ${businessDateColumn(businessDate)},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("document_type", "branch_id", "business_date")
      DO UPDATE SET
        "last_value" = "document_sequences"."last_value" + 1,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "last_value" AS "lastValue"
    `);
    const sequence = rows[0]?.lastValue;
    if (!Number.isSafeInteger(sequence) || sequence < 1) {
      throw new Error('Document sequence allocation returned an invalid value');
    }

    const compactDate = businessDate.slice(2).replaceAll('-', '');
    return `${input.prefix}-${compactDate}-${String(sequence).padStart(6, '0')}`;
  }
}
