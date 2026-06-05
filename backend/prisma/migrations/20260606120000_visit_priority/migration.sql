-- Visit priority (used by the automatic next-day reschedule on "out of time").
CREATE TYPE "VisitPriority" AS ENUM ('NORMAL', 'HIGH');
ALTER TABLE "visits" ADD COLUMN "priority" "VisitPriority" NOT NULL DEFAULT 'NORMAL';
