-- Split students.full_name into first_name and last_name
ALTER TABLE "students"
  ADD COLUMN "first_name" VARCHAR(255),
  ADD COLUMN "last_name" VARCHAR(255);

UPDATE "students"
SET
  "first_name" = COALESCE(NULLIF(split_part(TRIM("full_name"), ' ', 1), ''), 'Student'),
  "last_name" = COALESCE(TRIM(REGEXP_REPLACE(TRIM("full_name"), '^[^[:space:]]+[[:space:]]*', '')), '');

ALTER TABLE "students"
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL;

ALTER TABLE "students"
  DROP COLUMN "full_name";
