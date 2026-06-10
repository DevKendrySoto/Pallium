-- Admin Phase 1: administrative closure, must-change-password, user requests, dispatch discard.

ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "patients"
  ADD COLUMN "administrative_closure_at" TIMESTAMP(3),
  ADD COLUMN "administrative_closed_by_id" TEXT,
  ADD COLUMN "administrative_closure_notes" TEXT;
ALTER TABLE "patients" ADD CONSTRAINT "patients_administrative_closed_by_id_fkey"
  FOREIGN KEY ("administrative_closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "route_dispatches" ADD COLUMN "discarded_at" TIMESTAMP(3);

CREATE TYPE "UserRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "user_requests" (
  "id" TEXT NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role_code" TEXT NOT NULL,
  "reason" TEXT,
  "status" "UserRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "user_requests_status_idx" ON "user_requests"("status");
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
