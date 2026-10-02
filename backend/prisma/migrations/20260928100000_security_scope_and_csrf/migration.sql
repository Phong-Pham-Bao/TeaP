-- Add a server-side CSRF binding to refresh sessions. Existing rows remain
-- nullable so deployments can roll forward without invalidating every session.
ALTER TABLE "refresh_tokens"
ADD COLUMN "csrf_token_hash" VARCHAR(64);

-- A user can work in more than one branch. users.branch_id remains the primary
-- branch for backward compatibility while authorization reads this join table.
CREATE TABLE "user_branch_assignments" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "user_branch_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_branch_assignments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_branch_assignments_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "user_branch_assignments_user_id_branch_id_key"
ON "user_branch_assignments"("user_id", "branch_id");

CREATE INDEX "user_branch_assignments_branch_id_user_id_idx"
ON "user_branch_assignments"("branch_id", "user_id");

CREATE UNIQUE INDEX "user_branch_assignments_one_primary_per_user_idx"
ON "user_branch_assignments"("user_id")
WHERE "is_primary" = true;

-- Preserve all existing branch assignments during the rollout.
INSERT INTO "user_branch_assignments" (
  "id", "user_id", "branch_id", "is_primary", "updated_at"
)
SELECT 'uba_' || md5("id" || ':' || "branch_id"), "id", "branch_id", true, CURRENT_TIMESTAMP
FROM "users"
WHERE "branch_id" IS NOT NULL
ON CONFLICT ("user_id", "branch_id") DO NOTHING;
