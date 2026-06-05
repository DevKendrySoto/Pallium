-- CreateEnum
CREATE TYPE "VisitOutcome" AS ENUM ('COMPLETED', 'PATIENT_NOT_HOME', 'OUT_OF_TIME', 'REFUSED');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "refusal_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "caregiver_signature_key" TEXT,
ADD COLUMN     "check_in_lat" DOUBLE PRECISION,
ADD COLUMN     "check_in_lng" DOUBLE PRECISION,
ADD COLUMN     "outcome" "VisitOutcome",
ADD COLUMN     "signed_at" TIMESTAMP(3),
ADD COLUMN     "signer_name" TEXT;
