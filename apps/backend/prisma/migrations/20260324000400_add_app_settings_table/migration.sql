-- Create app settings table
CREATE TABLE "app_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- Default tax setting
INSERT INTO "app_settings" ("id", "key", "value", "description", "updated_at")
VALUES (
  'f4f3f8fd-50b9-4d96-8d56-5cf24a9f9001',
  'TAX_PERCENTAGE',
  '0',
  'Global tax percentage applied to all orders',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
