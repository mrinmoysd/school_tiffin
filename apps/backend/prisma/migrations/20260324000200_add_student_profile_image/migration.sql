-- Add profile image URL for students
ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;
