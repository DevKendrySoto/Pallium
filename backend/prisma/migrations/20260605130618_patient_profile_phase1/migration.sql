-- CreateEnum
CREATE TYPE "AllergyType" AS ENUM ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "HistoryCategory" AS ENUM ('PERSONAL', 'SURGICAL', 'FAMILY', 'OBSTETRIC');

-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('TOBACCO', 'ALCOHOL', 'DRUGS', 'OTHER');

-- CreateEnum
CREATE TYPE "HabitStatus" AS ENUM ('NEVER', 'ACTIVE', 'FORMER');

-- CreateTable
CREATE TABLE "allergies" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "type" "AllergyType" NOT NULL DEFAULT 'OTHER',
    "reaction" TEXT,
    "severity" "AllergySeverity" NOT NULL DEFAULT 'MODERATE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "category" "HistoryCategory" NOT NULL DEFAULT 'PERSONAL',
    "description" TEXT NOT NULL,
    "year" INTEGER,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "HabitType" NOT NULL,
    "status" "HabitStatus" NOT NULL DEFAULT 'NEVER',
    "detail" TEXT,
    "quantity" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance_directives" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "dnr" BOOLEAN NOT NULL DEFAULT false,
    "preferred_place_of_care" TEXT,
    "life_support_preferences" TEXT,
    "proxy_name" TEXT,
    "proxy_phone" TEXT,
    "document_key" TEXT,
    "signed_at" TIMESTAMP(3),
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advance_directives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allergies_patient_id_idx" ON "allergies"("patient_id");

-- CreateIndex
CREATE INDEX "medical_history_patient_id_idx" ON "medical_history"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "habits_patient_id_type_key" ON "habits"("patient_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "advance_directives_patient_id_key" ON "advance_directives"("patient_id");

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_directives" ADD CONSTRAINT "advance_directives_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
