FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build backend
WORKDIR /app
RUN pnpm --filter backend build

# Production image
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files and Prisma schema
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

WORKDIR /app

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/main"]
