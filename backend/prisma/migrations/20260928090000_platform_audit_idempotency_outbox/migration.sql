CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "branch_id" TEXT,
  "action" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" VARCHAR(100),
  "reason" VARCHAR(500),
  "metadata" JSONB,
  "correlation_id" VARCHAR(128) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "audit_events_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "idempotency_records" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "scope_key" VARCHAR(64) NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "key" VARCHAR(128) NOT NULL,
  "request_hash" VARCHAR(64) NOT NULL,
  "status" "IdempotencyStatus" NOT NULL DEFAULT 'PROCESSING',
  "response_status" INTEGER,
  "response_body" JSONB,
  "resource_type" VARCHAR(80),
  "resource_id" VARCHAR(100),
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "idempotency_records_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "idempotency_records_response_status_check" CHECK ("response_status" IS NULL OR "response_status" BETWEEN 200 AND 599)
);

CREATE TABLE "outbox_events" (
  "id" TEXT NOT NULL,
  "aggregate_type" VARCHAR(80) NOT NULL,
  "aggregate_id" VARCHAR(100) NOT NULL,
  "event_type" VARCHAR(120) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at" TIMESTAMPTZ(3),
  "locked_by" VARCHAR(100),
  "published_at" TIMESTAMPTZ(3),
  "last_error" VARCHAR(1000),
  "correlation_id" VARCHAR(128) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outbox_events_attempts_check" CHECK ("attempts" >= 0)
);

CREATE UNIQUE INDEX "idempotency_records_actor_id_scope_key_action_key_key"
  ON "idempotency_records"("actor_id", "scope_key", "action", "key");
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");
CREATE INDEX "idempotency_records_status_updated_at_idx" ON "idempotency_records"("status", "updated_at");

CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"("actor_id", "created_at");
CREATE INDEX "audit_events_branch_id_created_at_idx" ON "audit_events"("branch_id", "created_at");
CREATE INDEX "audit_events_resource_type_resource_id_created_at_idx" ON "audit_events"("resource_type", "resource_id", "created_at");
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");

CREATE INDEX "outbox_events_status_available_at_created_at_idx" ON "outbox_events"("status", "available_at", "created_at");
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");
CREATE INDEX "outbox_events_correlation_id_idx" ON "outbox_events"("correlation_id");
CREATE INDEX "outbox_events_ready_idx" ON "outbox_events"("available_at", "created_at")
  WHERE "status" IN ('PENDING', 'FAILED');
