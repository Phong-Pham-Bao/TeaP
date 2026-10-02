CREATE TABLE "document_sequences" (
  "id" TEXT NOT NULL,
  "document_type" VARCHAR(32) NOT NULL,
  "branch_id" TEXT NOT NULL,
  "business_date" DATE NOT NULL,
  "last_value" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_sequences_last_value_check" CHECK ("last_value" >= 0),
  CONSTRAINT "document_sequences_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "document_sequences_document_type_branch_id_business_date_key"
  ON "document_sequences"("document_type", "branch_id", "business_date");

DROP INDEX "orders_order_number_key";

CREATE UNIQUE INDEX "orders_branch_id_order_number_key"
  ON "orders"("branch_id", "order_number");
