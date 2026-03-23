-- Create meal plan type master table
CREATE TABLE "meal_plan_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plan_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meal_plan_types_code_key" ON "meal_plan_types"("code");
CREATE INDEX "meal_plan_types_is_active_idx" ON "meal_plan_types"("is_active");
CREATE INDEX "meal_plan_types_sort_order_idx" ON "meal_plan_types"("sort_order");
CREATE INDEX "meal_plan_types_deleted_at_idx" ON "meal_plan_types"("deleted_at");

-- Seed default meal plan types
INSERT INTO "meal_plan_types" ("id", "code", "display_name", "description", "sort_order", "updated_at")
VALUES
  ('7a8f2f11-9e11-4a6b-bf0f-a7a93f75a001', 'BREAKFAST', 'Breakfast', 'Morning meal plans', 10, CURRENT_TIMESTAMP),
  ('7a8f2f11-9e11-4a6b-bf0f-a7a93f75a002', 'LUNCH', 'Lunch', 'Midday meal plans', 20, CURRENT_TIMESTAMP),
  ('7a8f2f11-9e11-4a6b-bf0f-a7a93f75a003', 'SNACK', 'Snack', 'Light snack meal plans', 30, CURRENT_TIMESTAMP),
  ('7a8f2f11-9e11-4a6b-bf0f-a7a93f75a004', 'COMBO', 'Combo', 'Combined meal plans', 40, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Add new reference column to meal plans
ALTER TABLE "meal_plans"
ADD COLUMN "meal_plan_type_id" UUID;

-- Backfill from enum-based plan_type values
UPDATE "meal_plans" mp
SET "meal_plan_type_id" = mpt."id"
FROM "meal_plan_types" mpt
WHERE mpt."code" = mp."plan_type"::text
  AND mp."meal_plan_type_id" IS NULL;

-- Fallback assignment for any records that did not match the old enum value
UPDATE "meal_plans"
SET "meal_plan_type_id" = (
  SELECT "id"
  FROM "meal_plan_types"
  WHERE "code" = 'COMBO'
  LIMIT 1
)
WHERE "meal_plan_type_id" IS NULL;

ALTER TABLE "meal_plans"
ALTER COLUMN "meal_plan_type_id" SET NOT NULL;

CREATE INDEX "meal_plans_meal_plan_type_id_idx" ON "meal_plans"("meal_plan_type_id");

ALTER TABLE "meal_plans"
ADD CONSTRAINT "meal_plans_meal_plan_type_id_fkey"
FOREIGN KEY ("meal_plan_type_id") REFERENCES "meal_plan_types"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove legacy enum-based column
ALTER TABLE "meal_plans"
DROP COLUMN "plan_type";

DROP TYPE IF EXISTS "MealPlanType";
