CREATE TABLE "auth_rate_limits" (
  "key_hash" VARCHAR(64) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "reset_at" TIMESTAMPTZ(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key_hash")
);

CREATE INDEX "auth_rate_limits_reset_at_idx"
ON "auth_rate_limits"("reset_at");
