-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'PASSIVE', 'DECEASED');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('CEDULA', 'PASSPORT', 'BIRTH_CERTIFICATE', 'FOREIGN_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "Specialty" AS ENUM ('MEDICINE', 'NURSING', 'PSYCHOLOGY', 'SOCIAL_WORK', 'PHYSIOTHERAPY');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('REGULAR', 'EXTRAORDINARY');

-- CreateEnum
CREATE TYPE "ExtraordinaryReason" AS ENUM ('EMERGENCY', 'ANTIBIOTIC_THERAPY', 'SPECIAL_FOLLOWUP', 'WOUND_CARE');

-- CreateEnum
CREATE TYPE "VisitModality" AS ENUM ('HOME', 'CLINIC', 'TELEHEALTH');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('DRAFT', 'PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispatchChannel" AS ENUM ('WHATSAPP', 'SMS', 'MANUAL');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "ScaleCategory" AS ENUM ('FUNCTIONAL', 'PROGNOSTIC', 'SYMPTOM', 'PAIN', 'NUTRITIONAL', 'PSYCHOSOCIAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CLINICAL', 'SCALE_TRIGGERED', 'CADENCE', 'ADMINISTRATIVE', 'MEDICATION');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DiagnosisType" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'RULED_OUT');

-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('REGISTRATION', 'STATUS_CHANGE', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'CLINICAL_NOTE', 'SCALE_ASSESSMENT', 'ALERT_RAISED', 'ALERT_RESOLVED', 'DIAGNOSIS_ADDED', 'MEDICATION_CHANGE', 'DOCUMENT_UPLOADED', 'ADMISSION_APPROVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT', 'EXPORT', 'STATUS_TRANSITION', 'DISPATCH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "license_no" TEXT,
    "specialty" "Specialty",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_read_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "identification_type" "IdentificationType" NOT NULL,
    "identification_no" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "category_id" TEXT NOT NULL,
    "status" "PatientStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "admitted_at" TIMESTAMP(3),
    "deceased_at" TIMESTAMP(3),
    "last_regular_visit_at" TIMESTAMP(3),
    "next_regular_visit_due" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_status_history" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "from_status" "PatientStatus",
    "to_status" "PatientStatus" NOT NULL,
    "reason" TEXT,
    "changed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_addresses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "reference" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caregivers" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "VisitType" NOT NULL,
    "reason" "ExtraordinaryReason",
    "modality" "VisitModality" NOT NULL DEFAULT 'HOME',
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER,
    "address_id" TEXT,
    "check_in_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "rescheduled_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_assignments" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "specialty" "Specialty" NOT NULL,
    "is_lead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "route_date" TIMESTAMP(3) NOT NULL,
    "status" "RouteStatus" NOT NULL DEFAULT 'DRAFT',
    "driver_id" TEXT,
    "notes" TEXT,
    "dispatched_by_id" TEXT,
    "dispatched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "planned_arrival" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_dispatches" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "channel" "DispatchChannel" NOT NULL DEFAULT 'WHATSAPP',
    "to_phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "specialty" "Specialty" NOT NULL,
    "author_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clinical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_notes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "chief_complaint" TEXT,
    "present_illness" TEXT,
    "physical_exam" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "prognosis" TEXT,

    CONSTRAINT "medical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_notes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "general_care" TEXT,
    "wound_care" TEXT,
    "medication_admin" TEXT,
    "device_management" TEXT,
    "patient_education" TEXT,

    CONSTRAINT "nursing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psychology_notes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "emotional_state" TEXT,
    "mental_status" TEXT,
    "risk_assessment" TEXT,
    "interventions" TEXT,
    "plan" TEXT,

    CONSTRAINT "psychology_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_work_notes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "socioeconomic" TEXT,
    "family_support" TEXT,
    "home_environment" TEXT,
    "resources" TEXT,
    "interventions" TEXT,

    CONSTRAINT "social_work_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physiotherapy_notes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "functional_assessment" TEXT,
    "mobility" TEXT,
    "exercises_prescribed" TEXT,
    "goals" TEXT,
    "progress" TEXT,

    CONSTRAINT "physiotherapy_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measured_by_id" TEXT NOT NULL,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "temperature_c" DOUBLE PRECISION,
    "spo2" INTEGER,
    "pain_score" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "glucose_mg_dl" DOUBLE PRECISION,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "type" "DiagnosisType" NOT NULL DEFAULT 'SECONDARY',
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'ACTIVE',
    "onset_date" TIMESTAMP(3),
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "drug" TEXT NOT NULL,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "MedicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "prescribed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ScaleCategory" NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "alert_rule" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scale_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_assessments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "scale_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "assessed_by_id" TEXT NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "interpretation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scale_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "acknowledged_by_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "category" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_specialty_idx" ON "users"("specialty");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_categories_code_key" ON "patient_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "patients"("status");

-- CreateIndex
CREATE INDEX "patients_category_id_idx" ON "patients"("category_id");

-- CreateIndex
CREATE INDEX "patients_next_regular_visit_due_idx" ON "patients"("next_regular_visit_due");

-- CreateIndex
CREATE UNIQUE INDEX "patients_identification_type_identification_no_key" ON "patients"("identification_type", "identification_no");

-- CreateIndex
CREATE INDEX "patient_status_history_patient_id_idx" ON "patient_status_history"("patient_id");

-- CreateIndex
CREATE INDEX "patient_addresses_patient_id_idx" ON "patient_addresses"("patient_id");

-- CreateIndex
CREATE INDEX "caregivers_patient_id_idx" ON "caregivers"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "visits_rescheduled_to_id_key" ON "visits"("rescheduled_to_id");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visits_scheduled_date_idx" ON "visits"("scheduled_date");

-- CreateIndex
CREATE INDEX "visits_status_idx" ON "visits"("status");

-- CreateIndex
CREATE INDEX "visits_type_idx" ON "visits"("type");

-- CreateIndex
CREATE INDEX "visit_assignments_user_id_idx" ON "visit_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "visit_assignments_visit_id_user_id_key" ON "visit_assignments"("visit_id", "user_id");

-- CreateIndex
CREATE INDEX "routes_route_date_idx" ON "routes"("route_date");

-- CreateIndex
CREATE INDEX "routes_status_idx" ON "routes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_visit_id_key" ON "route_stops"("visit_id");

-- CreateIndex
CREATE INDEX "route_stops_route_id_idx" ON "route_stops"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_route_id_sequence_key" ON "route_stops"("route_id", "sequence");

-- CreateIndex
CREATE INDEX "route_dispatches_route_id_idx" ON "route_dispatches"("route_id");

-- CreateIndex
CREATE INDEX "clinical_records_patient_id_idx" ON "clinical_records"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_records_visit_id_idx" ON "clinical_records"("visit_id");

-- CreateIndex
CREATE INDEX "clinical_records_specialty_idx" ON "clinical_records"("specialty");

-- CreateIndex
CREATE UNIQUE INDEX "medical_notes_record_id_key" ON "medical_notes"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "nursing_notes_record_id_key" ON "nursing_notes"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychology_notes_record_id_key" ON "psychology_notes"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_work_notes_record_id_key" ON "social_work_notes"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "physiotherapy_notes_record_id_key" ON "physiotherapy_notes"("record_id");

-- CreateIndex
CREATE INDEX "vital_signs_record_id_idx" ON "vital_signs"("record_id");

-- CreateIndex
CREATE INDEX "diagnoses_patient_id_idx" ON "diagnoses"("patient_id");

-- CreateIndex
CREATE INDEX "medications_patient_id_idx" ON "medications"("patient_id");

-- CreateIndex
CREATE INDEX "medications_status_idx" ON "medications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scale_definitions_code_key" ON "scale_definitions"("code");

-- CreateIndex
CREATE INDEX "scale_assessments_patient_id_idx" ON "scale_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "scale_assessments_scale_id_idx" ON "scale_assessments"("scale_id");

-- CreateIndex
CREATE INDEX "scale_assessments_visit_id_idx" ON "scale_assessments"("visit_id");

-- CreateIndex
CREATE INDEX "alerts_patient_id_idx" ON "alerts"("patient_id");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "timeline_events_patient_id_occurred_at_idx" ON "timeline_events"("patient_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents"("storage_key");

-- CreateIndex
CREATE INDEX "documents_patient_id_idx" ON "documents"("patient_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "patient_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_status_history" ADD CONSTRAINT "patient_status_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_status_history" ADD CONSTRAINT "patient_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_addresses" ADD CONSTRAINT "patient_addresses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregivers" ADD CONSTRAINT "caregivers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "patient_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_rescheduled_to_id_fkey" FOREIGN KEY ("rescheduled_to_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_assignments" ADD CONSTRAINT "visit_assignments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_assignments" ADD CONSTRAINT "visit_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_dispatched_by_id_fkey" FOREIGN KEY ("dispatched_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_dispatches" ADD CONSTRAINT "route_dispatches_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_notes" ADD CONSTRAINT "medical_notes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psychology_notes" ADD CONSTRAINT "psychology_notes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_work_notes" ADD CONSTRAINT "social_work_notes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physiotherapy_notes" ADD CONSTRAINT "physiotherapy_notes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_measured_by_id_fkey" FOREIGN KEY ("measured_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_prescribed_by_id_fkey" FOREIGN KEY ("prescribed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_assessments" ADD CONSTRAINT "scale_assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_assessments" ADD CONSTRAINT "scale_assessments_scale_id_fkey" FOREIGN KEY ("scale_id") REFERENCES "scale_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_assessments" ADD CONSTRAINT "scale_assessments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_assessments" ADD CONSTRAINT "scale_assessments_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_id_fkey" FOREIGN KEY ("acknowledged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
