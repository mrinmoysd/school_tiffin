/*
  Warnings:

  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'ADMIN', 'SCHOOL_ADMIN');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING_PAYMENT';

-- DropIndex
DROP INDEX "users_phone_idx";

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "meal_plans" ADD COLUMN     "currency" VARCHAR(10) NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "name" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "data" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "pause_requests" ADD COLUMN     "affected_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "new_end_date" DATE;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "section" VARCHAR(50);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "currency" VARCHAR(10) NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone",
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "phone_verified_at" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
