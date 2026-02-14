# Install Notification Dependencies

Run these commands in the backend directory:

```bash
cd apps/backend

# Firebase Admin SDK (for FCM push notifications)
pnpm add firebase-admin

# Nodemailer (for email)
pnpm add nodemailer
pnpm add -D @types/nodemailer

# Twilio (for SMS) - Optional
pnpm add twilio
```

These packages are required for the Notifications Module.
