CREATE INDEX "audit_events_created_at_id_idx"
  ON "audit_events"("created_at", "id");

CREATE INDEX "idempotency_records_status_expires_at_id_idx"
  ON "idempotency_records"("status", "expires_at", "id");

CREATE INDEX "outbox_events_status_published_at_id_idx"
  ON "outbox_events"("status", "published_at", "id");

CREATE INDEX "outbox_events_status_created_at_id_idx"
  ON "outbox_events"("status", "created_at", "id");
