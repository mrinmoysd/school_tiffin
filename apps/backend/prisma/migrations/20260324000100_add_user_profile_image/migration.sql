-- Add profile image URL for users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;
