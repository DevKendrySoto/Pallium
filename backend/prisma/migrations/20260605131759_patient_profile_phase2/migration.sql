-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('CAREGIVER', 'DEPENDENT', 'SUPPORT', 'NONE');

-- AlterTable
ALTER TABLE "caregivers" ADD COLUMN     "burden_flag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_cohabitant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_zarit_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "genogram" JSONB;

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "age" INTEGER,
    "alive" BOOLEAN NOT NULL DEFAULT true,
    "role" "FamilyRole" NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_profiles" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "housing_type" TEXT,
    "accessibility" TEXT,
    "basic_services" TEXT,
    "income_level" TEXT,
    "occupation" TEXT,
    "insurance" TEXT,
    "dependents" INTEGER,
    "notes" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immunizations" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dose" TEXT,
    "lot" TEXT,
    "notes" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "immunizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_members_patient_id_idx" ON "family_members"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_patient_id_key" ON "social_profiles"("patient_id");

-- CreateIndex
CREATE INDEX "immunizations_patient_id_idx" ON "immunizations"("patient_id");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
