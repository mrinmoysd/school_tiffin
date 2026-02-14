# Install BullMQ and Bull Board

Run these commands in the backend directory:

```bash
cd apps/backend

# BullMQ and Bull Board for job monitoring
pnpm add @bull-board/api @bull-board/nestjs @bull-board/express

# UUID for generating IDs
pnpm add uuid
pnpm add -D @types/uuid
```

These packages are required for background job processing and monitoring.
