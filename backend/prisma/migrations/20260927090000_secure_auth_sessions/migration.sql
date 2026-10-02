-- Existing refresh tokens contain plaintext secrets. Revoke them during the
-- transition; users must sign in again after this migration.
ALTER TABLE "refresh_tokens"
  ALTER COLUMN "token" DROP NOT NULL,
  ADD COLUMN "token_hash" VARCHAR(64),
  ADD COLUMN "family_id" TEXT,
  ADD COLUMN "revoked_at" TIMESTAMP(3),
  ADD COLUMN "replaced_by_token_id" TEXT,
  ADD COLUMN "last_used_at" TIMESTAMP(3);

UPDATE "refresh_tokens"
SET "is_revoked" = TRUE,
    "revoked_at" = COALESCE("revoked_at", CURRENT_TIMESTAMP),
    "family_id" = gen_random_uuid()::text
WHERE "token" IS NOT NULL;

ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key"
  ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_family_id_is_revoked_idx"
  ON "refresh_tokens"("family_id", "is_revoked");
CREATE INDEX "refresh_tokens_expires_at_idx"
  ON "refresh_tokens"("expires_at");
DROP INDEX IF EXISTS "refresh_tokens_token_idx";
