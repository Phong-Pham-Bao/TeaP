CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE "approval_requests" (
  "id" TEXT NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" VARCHAR(100) NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "resource_version" INTEGER NOT NULL,
  "branch_id" TEXT NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "reason" VARCHAR(500),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_requests_resource_version_check" CHECK ("resource_version" >= 1),
  CONSTRAINT "approval_requests_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "approval_requests_requested_by_id_fkey"
    FOREIGN KEY ("requested_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "approval_decisions" (
  "id" TEXT NOT NULL,
  "approval_request_id" TEXT NOT NULL,
  "decision" "ApprovalDecisionType" NOT NULL,
  "decided_by_id" TEXT NOT NULL,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_decisions_request_id_fkey"
    FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "approval_decisions_decided_by_id_fkey"
    FOREIGN KEY ("decided_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "approval_requests_resource_type_resource_id_action_resource_version_key"
  ON "approval_requests"("resource_type", "resource_id", "action", "resource_version");
CREATE INDEX "approval_requests_branch_id_status_created_at_idx"
  ON "approval_requests"("branch_id", "status", "created_at");
CREATE INDEX "approval_requests_requested_by_id_created_at_idx"
  ON "approval_requests"("requested_by_id", "created_at");
CREATE UNIQUE INDEX "approval_decisions_approval_request_id_key"
  ON "approval_decisions"("approval_request_id");
CREATE INDEX "approval_decisions_decided_by_id_created_at_idx"
  ON "approval_decisions"("decided_by_id", "created_at");
