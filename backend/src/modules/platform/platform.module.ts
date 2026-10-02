import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { IdempotencyService } from './idempotency.service';
import { OutboxService } from './outbox.service';
import { OutboxWorkerService } from './outbox-worker.service';
import { DocumentSequenceService } from './document-sequence.service';
import { ApprovalService } from './approval.service';
import { PlatformOperationsController } from './platform-operations.controller';
import { PlatformOperationsService } from './platform-operations.service';

@Global()
@Module({
  controllers: [PlatformOperationsController],
  providers: [
    AuditService,
    IdempotencyService,
    OutboxService,
    OutboxWorkerService,
    DocumentSequenceService,
    ApprovalService,
    PlatformOperationsService,
  ],
  exports: [
    AuditService,
    IdempotencyService,
    OutboxService,
    DocumentSequenceService,
    ApprovalService,
  ],
})
export class PlatformModule {}
