-- Add max student limit per parent
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "max_students" INTEGER NOT NULL DEFAULT 4;

