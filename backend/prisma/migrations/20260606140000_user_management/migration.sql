-- User management (Phase 2): deactivation metadata + password change tracking.
ALTER TABLE "users"
  ADD COLUMN "password_changed_at" TIMESTAMP(3),
  ADD COLUMN "deactivated_at" TIMESTAMP(3),
  ADD COLUMN "deactivation_reason" TEXT;
