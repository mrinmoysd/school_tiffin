# Implementation Pattern Guide

**Purpose**: Ensure consistency across all modules following `BACKEND_IMPLEMENTATION_PLAN.md` guidelines.

---

## 📋 Current Implementation Status

### ✅ COMPLETED (85%)

**Week 2 - Core Business Logic (100%)**
1. ✅ Auth Module (Week 1)
2. ✅ Users Module
3. ✅ Students Module
4. ✅ Schools Module
5. ✅ Meal Plans Module
6. ✅ Menu Items Module
7. ✅ Subscriptions Module (with schedule engine)
8. ✅ Systematic Caching Strategy

**Week 3 - Advanced Features (70%)**
1. ✅ Pause Requests Module
2. ✅ Orders Module
3. ✅ Payments Module (Razorpay)

### ⏳ REMAINING (15%)

**Week 3 - To Complete**
1. ⏳ Notifications Module (FCM, Email, SMS)
2. ⏳ Notification APIs
3. ⏳ BullMQ Integration (Pause approval, Job monitoring)

**Week 4 - Admin & Polish**
1. ⏳ Admin Module (Dashboard, Deliveries, Users, Reports)
2. ⏳ CMS Module
3. ⏳ Uploads Module (AWS S3)
4. ⏳ Background Jobs (Daily Delivery, Expiry, Cleanup)

**Test Specs**
- ⏳ Week 2, 3, 4 test templates

---

## 🎯 Standard Module Pattern

### File Structure (Example: `notifications`)

```
apps/backend/src/notifications/
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
├── dto/
│   ├── create-notification.dto.ts
│   ├── update-notification.dto.ts
│   └── index.ts
└── providers/ (if needed)
    ├── fcm.provider.ts
    ├── email.provider.ts
    └── sms.provider.ts
```

---

## 📝 Step-by-Step Module Creation

### Step 1: Module File

**Pattern**: `{module-name}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {ModuleName}Controller } from './{module-name}.controller';
import { {ModuleName}Service } from './{module-name}.service';
import { PrismaModule } from '../prisma/prisma.module';
// Import other dependencies

@Module({
  imports: [PrismaModule, /* other modules */],
  controllers: [{ModuleName}Controller],
  providers: [{ModuleName}Service, /* other providers */],
  exports: [{ModuleName}Service], // If needed by other modules
})
export class {ModuleName}Module {}
```

**✅ Example from Schools Module:**
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
```

---

### Step 2: DTOs (Data Transfer Objects)

**Pattern**: `dto/{action}-{entity}.dto.ts`

**Key Requirements:**
- Use `class-validator` decorators
- Use `@ApiProperty()` for Swagger
- Include examples in Swagger decorators

```typescript
import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{Entity}Dto {
  @ApiProperty({
    description: 'Field description',
    example: 'Example value',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fieldName: string;

  @ApiProperty({
    description: 'Optional field',
    required: false,
  })
  @IsOptional()
  @IsString()
  optionalField?: string;
}
```

**✅ Example from Students Module:**
```typescript
export class CreateStudentDto {
  @ApiProperty({ description: 'Student full name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ description: 'School ID', example: '...' })
  @IsUUID()
  schoolId: string;
}
```

---

### Step 3: Service

**Pattern**: `{module-name}.service.ts`

**Key Requirements:**
- Use Prisma for database operations
- Use transactions for critical operations
- Implement caching where applicable (public endpoints)
- Include ownership validation for user data
- Return consistent response format

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class {ModuleName}Service {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // If caching needed
  ) {}

  async create(data: Create{Entity}Dto) {
    // Validation logic
    
    // Database transaction if multiple operations
    return await this.prisma.$transaction(async (tx) => {
      const entity = await tx.{entity}.create({ data });
      // Other operations
      return entity;
    });
  }

  async findAll() {
    // Check cache first (for public endpoints)
    const cached = await this.cacheManager.get('cache-key');
    if (cached) return cached;

    // Query database
    const results = await this.prisma.{entity}.findMany({ 
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    // Set cache
    await this.cacheManager.set('cache-key', results, 300);
    return results;
  }

  async findOne(id: string, userId?: string) {
    const entity = await this.prisma.{entity}.findUnique({
      where: { id, deletedAt: null },
      include: { /* relations */ },
    });

    if (!entity) {
      throw new NotFoundException('{Entity} not found');
    }

    // Ownership check if user-specific data
    if (userId && entity.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return entity;
  }

  async update(id: string, data: Update{Entity}Dto) {
    await this.findOne(id); // Verify exists
    
    const updated = await this.prisma.{entity}.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.cacheManager.del('cache-key');

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists

    // Soft delete
    await this.prisma.{entity}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheManager.del('cache-key');

    return { message: '{Entity} deleted successfully' };
  }
}
```

**✅ Critical Patterns Used:**
1. **Transactions**: All multi-step operations (Subscriptions, Payments)
2. **Caching**: All public endpoints (Schools, Meal Plans, Menu Items)
3. **Ownership**: All user-specific data (Students, Subscriptions, Orders)
4. **Soft Deletes**: Use `deletedAt` field, filter with `deletedAt: null`
5. **Error Handling**: `NotFoundException`, `BadRequestException`, `ForbiddenException`

---

### Step 4: Controller

**Pattern**: `{module-name}.controller.ts`

**Key Requirements:**
- Use `@ApiTags()` for Swagger grouping
- Use `@ApiOperation()` with detailed descriptions
- Use `@ApiResponse()` with example schemas
- Use `@ApiBearerAuth()` for protected routes
- Use `@Public()` decorator for public routes
- Use `@Roles()` decorator for admin-only routes
- Use `@CurrentUser()` to get authenticated user ID
- Use `ParseUUIDPipe` for UUID parameters

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { {ModuleName}Service } from './{module-name}.service';
import { Create{Entity}Dto, Update{Entity}Dto } from './dto';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('{Module Name}')
@ApiBearerAuth() // If protected by default
@Controller({ path: '{module-path}', version: '1' })
export class {ModuleName}Controller {
  constructor(private readonly {moduleName}Service: {ModuleName}Service) {}

  /**
   * Create {entity}
   */
  @Post()
  @Roles(Role.ADMIN) // If admin-only
  @ApiOperation({
    summary: 'Create {entity}',
    description: 'Detailed description of what this endpoint does.',
  })
  @ApiResponse({
    status: 201,
    description: '{Entity} created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: 'uuid-here',
          // ... example response
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() create{Entity}Dto: Create{Entity}Dto) {
    return this.{moduleName}Service.create(create{Entity}Dto);
  }

  /**
   * Get all {entities}
   */
  @Get()
  @Public() // If public
  @ApiOperation({
    summary: 'Get all {entities}',
    description: 'List all {entities}. Results are cached.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter parameter',
  })
  @ApiResponse({ status: 200, description: '{Entities} retrieved successfully' })
  async findAll(@Query('filter') filter?: string) {
    return this.{moduleName}Service.findAll(filter);
  }

  /**
   * Get {entity} by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get {entity} by ID',
    description: 'Get detailed information about a specific {entity}.',
  })
  @ApiParam({
    name: 'id',
    description: '{Entity} UUID',
    example: 'uuid-here',
  })
  @ApiResponse({ status: 200, description: '{Entity} found' })
  @ApiResponse({ status: 404, description: '{Entity} not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.{moduleName}Service.findOne(id);
  }

  /**
   * Update {entity}
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update {entity}',
    description: 'Update {entity} information.',
  })
  @ApiResponse({ status: 200, description: '{Entity} updated successfully' })
  @ApiResponse({ status: 404, description: '{Entity} not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() update{Entity}Dto: Update{Entity}Dto,
  ) {
    return this.{moduleName}Service.update(id, update{Entity}Dto);
  }

  /**
   * Delete {entity}
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete {entity}',
    description: 'Soft delete {entity}.',
  })
  @ApiResponse({ status: 200, description: '{Entity} deleted successfully' })
  @ApiResponse({ status: 404, description: '{Entity} not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.{moduleName}Service.remove(id);
  }
}
```

**✅ Swagger Documentation Requirements:**
- Every endpoint has `@ApiOperation()` with summary + description
- Every endpoint has `@ApiResponse()` with status codes
- Success responses (200, 201) include example schemas
- Error responses (400, 403, 404, 500) documented
- All parameters have `@ApiParam()` or `@ApiQuery()` with examples

---

### Step 5: Add to App Module

**Location**: `apps/backend/src/app.module.ts`

1. Import the module
2. Add to `imports` array

```typescript
import { {ModuleName}Module } from './{module-path}/{module-name}.module';

@Module({
  imports: [
    // ... existing modules
    {ModuleName}Module,
  ],
})
```

---

## 🔐 Security & Best Practices

### 1. Authentication & Authorization

**Decorators:**
- `@Public()` - Skip authentication (public endpoints)
- `@Roles(Role.ADMIN)` - Admin-only access
- `@CurrentUser('sub')` - Get authenticated user ID

**Example:**
```typescript
// Public endpoint
@Get()
@Public()
async getPublicData() { }

// Protected endpoint (default)
@Get('me')
async getProfile(@CurrentUser('sub') userId: string) { }

// Admin-only endpoint
@Post()
@Roles(Role.ADMIN)
async createResource() { }
```

### 2. Ownership Validation

Always verify user owns the resource:

```typescript
const subscription = await this.prisma.subscription.findFirst({
  where: {
    id: subscriptionId,
    student: { parentId: userId },
  },
});

if (!subscription) {
  throw new NotFoundException('Subscription not found');
}
```

### 3. Input Validation

All DTOs must have validation:
- `@IsString()`, `@IsUUID()`, `@IsInt()`, etc.
- `@MinLength()`, `@MaxLength()`, `@Min()`, `@Max()`
- `@IsOptional()` for optional fields
- `@IsEmail()` for emails
- `@IsDateString()` for dates

### 4. Database Transactions

Use for multi-step operations:

```typescript
return await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.subscription.update({ where: { id }, data: { status: 'ACTIVE' } });
  return order;
});
```

### 5. Caching Strategy

**Cache public endpoints (5-10 min TTL):**
- Schools list
- Meal plans list
- Menu items list

**Don't cache:**
- User-specific data (subscriptions, orders)
- Admin data (dashboard stats)
- Frequently changing data (delivery status)

**Cache invalidation:**
```typescript
// After create/update/delete
await this.cacheManager.del('cache-key');
```

---

## 📦 Dependencies Used

**Core:**
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `@prisma/client`, `prisma`
- `class-validator`, `class-transformer`
- `@nestjs/swagger`

**Database & Caching:**
- `@nestjs/cache-manager`, `cache-manager`, `cache-manager-redis-store`
- `ioredis`

**Authentication:**
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `bcrypt`

**Background Jobs:**
- `@nestjs/bull`, `bull`, `@bull-board/api`, `@bull-board/nestjs`, `@bull-board/express`

**Logging:**
- `nestjs-pino`, `pino-http`, `pino-pretty`

**Payments:**
- `razorpay`

**Notifications:**
- `firebase-admin` (FCM)
- `nodemailer` (Email)
- `twilio` (SMS)

**File Upload:**
- `@aws-sdk/client-s3`

**Utilities:**
- `date-fns` (date manipulation)
- `compression` (response compression)
- `helmet` (security)

---

## 🧪 Test Spec Pattern

**Location**: `apps/backend/test/{module}.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('{ModuleName}Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /{module-path}', () => {
    it('should create {entity}', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/{module-path}')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ /* test data */ })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /{module-path}', () => {
    it('should get all {entities}', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/{module-path}')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // More test cases...
});
```

---

## 📋 Module Implementation Checklist

For each module, ensure:

**Files Created:**
- [ ] `{module}.module.ts`
- [ ] `{module}.service.ts`
- [ ] `{module}.controller.ts`
- [ ] `dto/create-{entity}.dto.ts`
- [ ] `dto/update-{entity}.dto.ts` (if applicable)
- [ ] `dto/index.ts`
- [ ] Test spec (template)

**Code Quality:**
- [ ] All DTOs have validation decorators
- [ ] All DTOs have Swagger decorators with examples
- [ ] Service uses Prisma correctly
- [ ] Transactions used for multi-step operations
- [ ] Caching implemented for public endpoints
- [ ] Ownership validation for user-specific data
- [ ] Soft deletes implemented (`deletedAt`)
- [ ] Controller has complete Swagger documentation
- [ ] Error handling with proper HTTP status codes
- [ ] Module added to `app.module.ts`

**Swagger Documentation:**
- [ ] `@ApiTags()` on controller
- [ ] `@ApiOperation()` on all endpoints with description
- [ ] `@ApiResponse()` for all status codes
- [ ] Success responses include example schemas
- [ ] `@ApiParam()` for all path parameters
- [ ] `@ApiQuery()` for all query parameters
- [ ] `@ApiBearerAuth()` for protected routes

---

## 🎯 Next Steps - Remaining Modules

Following this pattern, implement:

1. **Notifications Module** (Week 3)
   - FCM Provider
   - Email Provider  
   - SMS Provider
   - Notification Service
   - Notification Controller
   - Test spec

2. **Admin Module** (Week 4)
   - Admin Controller (Dashboard, Deliveries, Users, Reports)
   - Admin Service
   - Caching for dashboard stats
   - Test spec

3. **CMS Module** (Week 4)
   - CMS Controller
   - CMS Service
   - Caching for published pages
   - Test spec

4. **Uploads Module** (Week 4)
   - S3 Service
   - Uploads Controller
   - File validation
   - Test spec

5. **Background Jobs** (Week 4)
   - BullMQ processors
   - Daily Delivery Job
   - Subscription Expiry Job
   - Cleanup Jobs
   - Bull Board monitoring
   - Pause approval processing
   - Test specs

---

## ✅ Quality Gates

Before marking module as complete:

1. **Compiles without errors** - No TypeScript errors
2. **Follows pattern** - Matches this guide exactly
3. **Complete Swagger** - All endpoints documented with examples
4. **Security** - Authentication, authorization, ownership checks
5. **Error handling** - Proper exceptions and status codes
6. **Test spec created** - Template ready for execution

---

**This guide ensures 100% consistency across all modules!** 🎯
