-- AlterTable
ALTER TABLE "clinical_records" ADD COLUMN     "data" JSONB,
ADD COLUMN     "template_key" TEXT;

-- CreateTable
CREATE TABLE "clinical_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" "Specialty",
    "category_code" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sections" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_templates_key_key" ON "clinical_templates"("key");

-- CreateIndex
CREATE INDEX "clinical_templates_specialty_idx" ON "clinical_templates"("specialty");
