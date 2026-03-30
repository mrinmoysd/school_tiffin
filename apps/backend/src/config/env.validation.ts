import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional().default('test_key'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('test_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('test_webhook_secret'),

  // Firebase
  FCM_SERVER_KEY: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // SMS
  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')),

  // Local uploads
  UPLOAD_DIR: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const envSchemaWithRules = envSchema.superRefine((env, ctx) => {
  const hasCloudName = Boolean(env.CLOUDINARY_CLOUD_NAME?.trim());
  const hasApiKey = Boolean(env.CLOUDINARY_API_KEY?.trim());
  const hasApiSecret = Boolean(env.CLOUDINARY_API_SECRET?.trim());
  const configuredCount = Number(hasCloudName) + Number(hasApiKey) + Number(hasApiSecret);

  if (configuredCount > 0 && configuredCount < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLOUDINARY_CLOUD_NAME'],
      message:
        'Cloudinary is partially configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET together.',
    });
  }

  if (env.NODE_ENV === 'production' && configuredCount !== 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLOUDINARY_CLOUD_NAME'],
      message:
        'Cloudinary credentials are required in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    });
  }
});

export type Env = z.infer<typeof envSchemaWithRules>;

export function validateEnv(): Env {
  try {
    return envSchemaWithRules.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}
