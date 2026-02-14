/*
  Warnings:

  - You are about to drop the column `payment_status` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pause_from_date` on the `pause_requests` table. All the data in the column will be lost.
  - You are about to drop the column `pause_to_date` on the `pause_requests` table. All the data in the column will be lost.
  - You are about to drop the column `current_end_date` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `original_end_date` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `subscriptions` table. All the data in the column will be lost.
  - Added the required column `status` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `pause_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `pause_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'ADMIN', 'SCHOOL_ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- DropIndex
DROP INDEX "orders_payment_status_idx";

-- DropIndex
DROP INDEX "subscriptions_start_date_current_end_date_idx";

-- AlterTable
ALTER TABLE "meal_plans" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "data" JSONB,
ADD COLUMN     "read_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "payment_status",
ADD COLUMN     "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "pause_requests" DROP COLUMN "pause_from_date",
DROP COLUMN "pause_to_date",
ADD COLUMN     "end_date" DATE NOT NULL,
ADD COLUMN     "start_date" DATE NOT NULL;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "current_end_date",
DROP COLUMN "original_end_date",
DROP COLUMN "total_amount",
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "end_date" DATE NOT NULL,
ADD COLUMN     "total_price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "device" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fcm_tokens_user_id_idx" ON "fcm_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_user_id_token_key" ON "fcm_tokens"("user_id", "token");

-- CreateIndex
CREATE INDEX "meal_plans_deleted_at_idx" ON "meal_plans"("deleted_at");

-- CreateIndex
CREATE INDEX "menu_items_deleted_at_idx" ON "menu_items"("deleted_at");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "schools_deleted_at_idx" ON "schools"("deleted_at");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "students"("deleted_at");

-- CreateIndex
CREATE INDEX "subscriptions_start_date_end_date_idx" ON "subscriptions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
