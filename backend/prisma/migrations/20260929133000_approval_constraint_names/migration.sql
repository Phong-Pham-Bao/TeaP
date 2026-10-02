ALTER TABLE "approval_decisions"
  RENAME CONSTRAINT "approval_decisions_request_id_fkey"
  TO "approval_decisions_approval_request_id_fkey";

ALTER INDEX "approval_requests_resource_type_resource_id_action_resource_ver"
  RENAME TO "approval_requests_resource_type_resource_id_action_resource_key";
