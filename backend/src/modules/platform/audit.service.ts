import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface RecordAuditEvent {
  actorId?: string;
  branchId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
  correlationId: string;
}

@Injectable()
export class AuditService {
  record(tx: Prisma.TransactionClient, event: RecordAuditEvent) {
    return tx.auditEvent.create({ data: event });
  }
}
