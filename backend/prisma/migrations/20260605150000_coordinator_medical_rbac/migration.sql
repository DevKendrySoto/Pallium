-- Coordinator-medical RBAC reorg + state-model change.
-- Surgical migration: no destructive data loss. Patients pending approval are
-- moved to ACTIVE and the transition is recorded in audit_logs.

-- 1) Data migration: any patient still in PENDING_APPROVAL becomes ACTIVE,
--    audit-logged as an automatic migration (actor null = system).
INSERT INTO "audit_logs" ("id", "actor_id", "action", "entity_type", "entity_id", "before", "after", "created_at")
SELECT
  gen_random_uuid()::text,
  NULL,
  'STATUS_TRANSITION',
  'Patient',
  p."id",
  jsonb_build_object('status', 'PENDING_APPROVAL'),
  jsonb_build_object('status', 'ACTIVE', 'reason', 'Migración automática por cambio de modelo de roles'),
  now()
FROM "patients" p
WHERE p."status" = 'PENDING_APPROVAL';

UPDATE "patients"
SET "status" = 'ACTIVE',
    "admitted_at" = COALESCE("admitted_at", now())
WHERE "status" = 'PENDING_APPROVAL';

-- 2) New columns: patient death detail + route clinical team.
ALTER TABLE "patients"
  ADD COLUMN "death_date" TIMESTAMP(3),
  ADD COLUMN "death_place" TEXT;

ALTER TABLE "routes"
  ADD COLUMN "assigned_medical_id" TEXT,
  ADD COLUMN "assigned_nursing_id" TEXT;

ALTER TABLE "routes"
  ADD CONSTRAINT "routes_assigned_medical_id_fkey"
  FOREIGN KEY ("assigned_medical_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "routes"
  ADD CONSTRAINT "routes_assigned_nursing_id_fkey"
  FOREIGN KEY ("assigned_nursing_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) Sanitize historical PENDING_APPROVAL references so the enum can be recreated.
--    Admission rows (PENDING_APPROVAL → ACTIVE) keep their target; the source
--    becomes NULL (no prior tracked state). to_status is never PENDING_APPROVAL,
--    but guard it just in case.
UPDATE "patient_status_history" SET "from_status" = NULL WHERE "from_status"::text = 'PENDING_APPROVAL';
UPDATE "patient_status_history" SET "to_status" = 'ACTIVE' WHERE "to_status"::text = 'PENDING_APPROVAL';

-- 4) Drop PENDING_APPROVAL from the PatientStatus enum (no rows use it now).
ALTER TYPE "PatientStatus" RENAME TO "PatientStatus_old";
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'DECEASED');

ALTER TABLE "patients" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "patients" ALTER COLUMN "status" TYPE "PatientStatus" USING ("status"::text::"PatientStatus");
ALTER TABLE "patient_status_history" ALTER COLUMN "from_status" TYPE "PatientStatus" USING ("from_status"::text::"PatientStatus");
ALTER TABLE "patient_status_history" ALTER COLUMN "to_status" TYPE "PatientStatus" USING ("to_status"::text::"PatientStatus");
ALTER TABLE "patients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "PatientStatus_old";
