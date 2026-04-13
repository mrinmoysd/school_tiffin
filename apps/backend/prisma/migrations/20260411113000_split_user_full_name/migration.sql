-- Split users.full_name into first_name and last_name
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "last_name" VARCHAR(255);

UPDATE "users"
SET
  "first_name" = COALESCE(NULLIF(split_part(TRIM("full_name"), ' ', 1), ''), 'Parent'),
  "last_name" = COALESCE(TRIM(REGEXP_REPLACE(TRIM("full_name"), '^[^[:space:]]+[[:space:]]*', '')), '');

ALTER TABLE "users"
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL;

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "full_name";

