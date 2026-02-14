# AI Agent Quick Reference Card

**For detailed information, see: [`AI_AGENT_SKILLS_GUIDE.md`](./AI_AGENT_SKILLS_GUIDE.md)**

---

## 🚀 Quick Start Checklist

### Creating a New Module

```bash
# 1. Generate files
nest g module {name}
nest g controller {name} --no-spec
nest g service {name} --no-spec
mkdir src/{name}/dto

# 2. Create files in this order:
# - dto/create-{entity}.dto.ts
# - dto/update-{entity}.dto.ts
# - dto/index.ts
# - {name}.service.ts
# - {name}.controller.ts
# - test/{name}.e2e-spec.ts

# 3. Import in app.module.ts
```

---

## 📋 File Templates (Copy-Paste Ready)

### DTO Template

```typescript
import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{Entity}Dto {
  @ApiProperty({ description: 'Field name', example: 'Example value' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fieldName: string;

  @ApiProperty({ description: 'Optional field', required: false })
  @IsOptional()
  @IsString()
  optionalField?: string;

  @ApiProperty({ description: 'UUID reference', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  relationId: string;
}
```

### Service Template

```typescript
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class {ModuleName}Service {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, createDto: any) {
    return await this.prisma.$transaction(async (tx) => {
      const entity = await tx.{entity}.create({
        data: {
          ...createDto,
          user: { connect: { id: userId } },
        },
      });
      await this.cacheManager.del('cache-key');
      return entity;
    });
  }
}
```

### Controller Template

```typescript
import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, Public, Roles, UserRole } from '../common/decorators';

@ApiTags('{Module Name}')
@ApiBearerAuth()
@Controller({ path: '{path}', version: '1' })
export class {ModuleName}Controller {
  constructor(private readonly service: {ModuleName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create {entity}', description: 'Detailed description' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: any) {
    return this.service.create(userId, dto);
  }
}
```

---

## ⚡ Common Patterns

### Prisma Relations (Use Connect!)

```typescript
// ✅ CORRECT
await prisma.subscription.create({
  data: {
    student: { connect: { id: studentId } },
    mealPlan: { connect: { id: mealPlanId } },
    // other fields
  },
});

// ❌ WRONG
await prisma.subscription.create({
  data: {
    studentId: studentId, // Type error!
  },
});
```

### Transactions

```typescript
return await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.subscription.update({ where: { id }, data: { status: 'ACTIVE' } });
  return order;
});
```

### Caching

```typescript
// Check cache
const cached = await this.cacheManager.get('key');
if (cached) return cached;

// Query DB
const data = await this.prisma.entity.findMany();

// Set cache (TTL in seconds)
await this.cacheManager.set('key', data, 300);

// Invalidate on mutation
await this.cacheManager.del('key');
```

### Authentication Decorators

```typescript
@Get()
@Public()  // No auth required
async publicEndpoint() {}

@Get('me')
async protectedEndpoint(@CurrentUser('sub') userId: string) {}

@Post()
@Roles(UserRole.ADMIN)  // Admin only
async adminEndpoint() {}
```

---

## 🔍 Common Errors & Quick Fixes

### Error: "Type 'string' is not assignable to type 'never'"
**Fix**: Use Prisma `connect` syntax instead of direct ID assignment

### Error: "Can't resolve dependencies (?, ?)"
**Fix**: Check if CacheModule is imported globally in app.module.ts

### Error: "require() of ES Module not supported"
**Fix**: Downgrade package to CommonJS-compatible version (e.g., uuid@9)

### Error: "Cannot do arithmetic on Decimal"
**Fix**: Convert to number: `Number(order.amount)`

### Error: "Enum conflict"
**Fix**: Import UserRole from correct source:
- For `@Roles()`: `import { UserRole } from '../common/decorators'`
- For Prisma: `import { UserRole } from '@prisma/client'`

---

## 📦 Common Imports

```typescript
// NestJS
import { Injectable, Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Validation
import { IsString, IsEmail, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Database
import { PrismaService } from '../prisma/prisma.service';

// Cache
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

// Custom
import { CurrentUser, Public, Roles, UserRole } from '../common/decorators';
import { ParseUUIDPipe } from '@nestjs/common';
```

---

## ✅ Before Committing Checklist

- [ ] No TypeScript errors
- [ ] All DTOs have validation decorators
- [ ] All endpoints have Swagger documentation
- [ ] Service uses transactions for multi-step operations
- [ ] Caching implemented for public endpoints
- [ ] Ownership validation for user-specific data
- [ ] Soft deletes (`deletedAt`) implemented
- [ ] Error handling with proper HTTP status codes
- [ ] Module added to `app.module.ts`
- [ ] Test spec created

---

## 🎯 Validation Decorators Cheat Sheet

```typescript
// Strings
@IsString()
@MinLength(3)
@MaxLength(255)
@IsOptional()  // Makes field optional

// Numbers
@IsInt()
@IsNumber()
@Min(0)
@Max(100)

// Special Types
@IsEmail()
@IsUUID()
@IsDateString()
@IsBoolean()
@IsEnum(MyEnum)

// Arrays
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(10)
```

---

## 📊 HTTP Status Codes

```typescript
200 - OK (GET, PATCH)
201 - Created (POST)
204 - No Content (DELETE)
400 - Bad Request (Validation error)
401 - Unauthorized (Not authenticated)
403 - Forbidden (Not authorized)
404 - Not Found
409 - Conflict (Duplicate)
500 - Internal Server Error
```

---

## 🎨 Swagger Response Template

```typescript
@ApiResponse({
  status: 201,
  description: 'Resource created successfully',
  schema: {
    example: {
      success: true,
      statusCode: 201,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Example',
        createdAt: '2026-02-11T10:00:00.000Z',
      },
      timestamp: '2026-02-11T10:00:00.000Z',
    },
  },
})
```

---

## 🔐 Security Checklist

- [ ] `@ApiBearerAuth()` on protected controllers
- [ ] `@Public()` only on truly public endpoints
- [ ] `@Roles(UserRole.ADMIN)` on admin endpoints
- [ ] Ownership validation in service methods
- [ ] Input sanitization (global pipe handles this)
- [ ] Password hashing with bcrypt
- [ ] JWT tokens with expiration
- [ ] Rate limiting configured

---

## 📝 Naming Conventions

### Files
- Modules: `{name}.module.ts`
- Controllers: `{name}.controller.ts`
- Services: `{name}.service.ts`
- DTOs: `create-{entity}.dto.ts`, `update-{entity}.dto.ts`
- Tests: `{name}.e2e-spec.ts`

### Code
- Classes: `PascalCase` (e.g., `UserService`)
- Methods: `camelCase` (e.g., `findAll`, `createUser`)
- Variables: `camelCase` (e.g., `userId`, `mealPlan`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `CACHE_KEY_PREFIX`)
- Database fields: `snake_case` in schema, `camelCase` in code

---

## 🚨 Critical "DO NOT" Rules

1. ❌ DO NOT use `any` type
2. ❌ DO NOT hard delete data
3. ❌ DO NOT skip transactions for multi-step operations
4. ❌ DO NOT skip validation decorators
5. ❌ DO NOT skip Swagger documentation
6. ❌ DO NOT expose passwords/tokens in responses
7. ❌ DO NOT skip ownership validation
8. ❌ DO NOT cache user-specific data
9. ❌ DO NOT use direct ID assignment (use `connect`)
10. ❌ DO NOT skip error handling

---

## 🎓 Learn from These Files

**Study these for best practices**:
- `src/auth/` - Complete auth implementation
- `src/subscriptions/` - Complex business logic with transactions
- `src/schools/` - Caching strategy
- `src/payments/` - External API integration (Razorpay)
- `src/admin/` - Dashboard aggregations
- `src/common/` - Reusable utilities

---

## 🔗 Important File Locations

```
apps/backend/
├── src/
│   ├── app.module.ts           # Global module config
│   ├── main.ts                 # Application entry point
│   ├── common/
│   │   ├── decorators/         # @Public, @Roles, @CurrentUser
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/       # ResponseInterceptor
│   │   └── pipes/              # SanitizePipe
│   └── {modules}/              # Feature modules
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── test/                       # E2E tests
└── .env                        # Environment variables
```

---

## 💡 Pro Tips

1. **Run `prisma generate` after schema changes**
2. **Use `pnpm run start:dev` for hot-reload**
3. **Access Swagger at `http://localhost:3000/api/docs`**
4. **Use Bull Board at `http://localhost:3000/admin/queues`**
5. **Check health at `http://localhost:3000/health`**
6. **Always test in Swagger UI before marking complete**
7. **Use transactions for data consistency**
8. **Cache strategically (only public, relatively static data)**
9. **Document as you code, not after**
10. **Follow existing patterns exactly**

---

## 📞 Quick Command Reference

```bash
# Development
pnpm run start:dev              # Start with hot-reload
pnpm run build                  # Build for production
pnpm run start:prod             # Run production build

# Database
pnpm run prisma:generate        # Generate Prisma client
pnpm run migrate:dev            # Run migrations (dev)
pnpm run prisma:studio          # Open Prisma Studio GUI

# Testing
pnpm run test                   # Run unit tests
pnpm run test:e2e              # Run E2E tests
pnpm run test:cov              # Test with coverage

# Linting
pnpm run lint                   # Lint code
pnpm run format                 # Format code
```

---

**For complete details, patterns, and examples, refer to: [`AI_AGENT_SKILLS_GUIDE.md`](./AI_AGENT_SKILLS_GUIDE.md)**
