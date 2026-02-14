# AI Agent Skills Guide - School Tiffin Platform

**Purpose**: Comprehensive reference for AI agents to maintain system design, architecture, and code quality standards while working on any task.

**Last Updated**: February 11, 2026  
**Project**: School Tiffin / Healthy Food Ordering Platform  
**Architecture**: Modular Monolith → Microservices Ready

---

## 🎯 Core Principles

### 1. Architecture Philosophy
- **Current**: Modular Monolith with service-oriented modules
- **Future**: Microservices-ready design
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for performance optimization
- **Queue**: BullMQ for background jobs
- **API Style**: RESTful with versioning (`/api/v1/`)

### 2. Code Quality Standards
- **Type Safety**: 100% TypeScript, no `any` types
- **Validation**: Every input validated with `class-validator`
- **Documentation**: Every endpoint documented with Swagger
- **Testing**: Test specs required for all modules
- **Security**: Authentication, authorization, input sanitization mandatory

### 3. Development Approach
- **Pattern Consistency**: Follow existing patterns exactly
- **DRY Principle**: Reuse common utilities and decorators
- **Error Handling**: Use proper HTTP status codes and exceptions
- **Transactions**: Use for all multi-step database operations
- **Soft Deletes**: Never hard delete data (`deletedAt` field)

---

## 🏗️ System Architecture

### Tech Stack

**Backend (NestJS)**:
- Runtime: Node.js v20 LTS
- Framework: NestJS v10
- Language: TypeScript v5
- Database: PostgreSQL + Prisma v5
- Cache: Redis + ioredis
- Queue: BullMQ + Bull Board
- Authentication: JWT + Passport
- API Docs: Swagger/OpenAPI

**Key Dependencies**:
```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@nestjs/swagger": "^7.2.0",
  "@nestjs/cache-manager": "^3.1.0",
  "@nestjs/bull": "^10.1.0",
  "@nestjs/throttler": "^6.5.0",
  "@prisma/client": "^5.8.0",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1",
  "bcrypt": "^5.1.1",
  "razorpay": "^2.9.6",
  "firebase-admin": "^13.6.1",
  "date-fns": "^4.1.0",
  "uuid": "^9.0.1"
}
```

### Database Schema Conventions

**Naming**:
- Tables: `snake_case` (e.g., `meal_plans`, `subscription_days`)
- Models: `PascalCase` (e.g., `MealPlan`, `SubscriptionDay`)
- Fields: `camelCase` in code, `snake_case` in DB
- Primary Keys: Always `id` (UUID)
- Foreign Keys: `{entity}Id` (e.g., `userId`, `schoolId`)
- Timestamps: `createdAt`, `updatedAt`, `deletedAt`

**Required Fields**:
- All tables have: `id`, `createdAt`, `updatedAt`
- User-facing tables have: `deletedAt` (soft delete)
- Audit tables have: `userId`, `ipAddress`, `userAgent`

---

## 📁 Module Structure Pattern

### Standard Module File Structure

```
apps/backend/src/{module-name}/
├── {module-name}.module.ts          # Module definition
├── {module-name}.controller.ts      # API endpoints
├── {module-name}.service.ts         # Business logic
├── dto/
│   ├── create-{entity}.dto.ts       # Create DTO
│   ├── update-{entity}.dto.ts       # Update DTO (optional)
│   └── index.ts                     # Export all DTOs
└── providers/                       # Optional: external services
    ├── {provider-name}.provider.ts
    └── index.ts
```

### Module Template

```typescript
// {module-name}.module.ts
import { Module } from '@nestjs/common';
import { {ModuleName}Controller } from './{module-name}.controller';
import { {ModuleName}Service } from './{module-name}.service';
import { PrismaModule } from '../prisma/prisma.module';
// Import other required modules

@Module({
  imports: [
    PrismaModule,
    // Other modules (e.g., BullModule, NotificationsModule)
  ],
  controllers: [{ModuleName}Controller],
  providers: [{ModuleName}Service, /* other providers */],
  exports: [{ModuleName}Service], // If used by other modules
})
export class {ModuleName}Module {}
```

**Critical Rules**:
- Always import `PrismaModule` for database access
- Import `CacheModule` is global (no need to import)
- Export service if used by other modules
- Add module to `app.module.ts` imports array

---

## 🎨 DTO Pattern (Data Transfer Objects)

### Create DTO Template

```typescript
// dto/create-{entity}.dto.ts
import { 
  IsString, IsUUID, IsEmail, IsOptional, 
  MinLength, MaxLength, IsInt, Min, Max,
  IsEnum, IsDateString, IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{Entity}Dto {
  @ApiProperty({
    description: 'Field description (be descriptive)',
    example: 'Realistic example value',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fieldName: string;

  @ApiProperty({
    description: 'Optional field description',
    required: false,
    example: 'Optional value',
  })
  @IsOptional()
  @IsString()
  optionalField?: string;

  @ApiProperty({
    description: 'Enum field description',
    enum: MyEnum,
    example: MyEnum.VALUE,
  })
  @IsEnum(MyEnum)
  enumField: MyEnum;

  @ApiProperty({
    description: 'UUID reference',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  relationId: string;
}
```

### Update DTO Template

```typescript
// dto/update-{entity}.dto.ts
import { PartialType } from '@nestjs/swagger';
import { Create{Entity}Dto } from './create-{entity}.dto';

// Simple approach: Make all fields optional
export class Update{Entity}Dto extends PartialType(Create{Entity}Dto) {}
```

### DTO Index File

```typescript
// dto/index.ts
export * from './create-{entity}.dto';
export * from './update-{entity}.dto';
```

**Validation Rules**:
- Every field MUST have `class-validator` decorators
- Every field MUST have `@ApiProperty()` with example
- Required fields: No `@IsOptional()`
- Optional fields: Always add `@IsOptional()` first
- Strings: Always set `@MinLength()` and `@MaxLength()`
- Numbers: Always set `@Min()` and `@Max()`
- Emails: Use `@IsEmail()`
- UUIDs: Use `@IsUUID()`
- Dates: Use `@IsDateString()`
- Enums: Use `@IsEnum(EnumType)`

---

## 🔧 Service Pattern

### Service Template with Best Practices

```typescript
// {module-name}.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  Inject 
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Create{Entity}Dto, Update{Entity}Dto } from './dto';

@Injectable()
export class {ModuleName}Service {
  private readonly CACHE_KEY_PREFIX = '{module}:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create {entity}
   */
  async create(userId: string, createDto: Create{Entity}Dto) {
    // 1. Validate relationships
    const relatedEntity = await this.prisma.relatedEntity.findUnique({
      where: { id: createDto.relationId },
    });

    if (!relatedEntity) {
      throw new BadRequestException('Related entity not found');
    }

    // 2. Use transaction for multi-step operations
    return await this.prisma.$transaction(async (tx) => {
      const entity = await tx.{entity}.create({
        data: {
          ...createDto,
          userId,
          // Use connect for relations
          relatedEntity: { connect: { id: createDto.relationId } },
        },
        include: {
          relatedEntity: {
            select: { id: true, name: true },
          },
        },
      });

      // 3. Invalidate cache if applicable
      await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}all`);

      return entity;
    });
  }

  /**
   * Get all {entities} (with caching for public endpoints)
   */
  async findAll(filters?: any) {
    // 1. Check cache first (only for public endpoints)
    const cacheKey = `${this.CACHE_KEY_PREFIX}all:${JSON.stringify(filters)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // 2. Query database
    const entities = await this.prisma.{entity}.findMany({
      where: {
        deletedAt: null, // Always filter soft-deleted records
        ...filters,
      },
      include: {
        relatedEntity: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Set cache
    await this.cacheManager.set(cacheKey, entities, this.CACHE_TTL);

    return entities;
  }

  /**
   * Get {entity} by ID (with ownership validation)
   */
  async findOne(id: string, userId?: string) {
    const entity = await this.prisma.{entity}.findFirst({
      where: { 
        id,
        deletedAt: null,
        // Ownership check if user-specific data
        ...(userId && { userId }),
      },
      include: {
        relatedEntity: true,
      },
    });

    if (!entity) {
      throw new NotFoundException('{Entity} not found');
    }

    return entity;
  }

  /**
   * Update {entity}
   */
  async update(id: string, userId: string, updateDto: Update{Entity}Dto) {
    // 1. Verify entity exists and user owns it
    await this.findOne(id, userId);

    // 2. Validate related entities if updating relations
    if (updateDto.relationId) {
      const related = await this.prisma.relatedEntity.findUnique({
        where: { id: updateDto.relationId },
      });
      if (!related) {
        throw new BadRequestException('Related entity not found');
      }
    }

    // 3. Update with transaction if needed
    const updated = await this.prisma.{entity}.update({
      where: { id },
      data: {
        ...updateDto,
        // Use connect for relations if updating
        ...(updateDto.relationId && {
          relatedEntity: { connect: { id: updateDto.relationId } },
        }),
      },
      include: {
        relatedEntity: true,
      },
    });

    // 4. Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}all`);

    return updated;
  }

  /**
   * Soft delete {entity}
   */
  async remove(id: string, userId: string) {
    // 1. Verify exists and ownership
    await this.findOne(id, userId);

    // 2. Soft delete
    await this.prisma.{entity}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 3. Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}all`);

    return { message: '{Entity} deleted successfully' };
  }
}
```

**Service Critical Rules**:

1. **Transactions**: Use `prisma.$transaction()` for:
   - Creating order + updating subscription
   - Creating subscription + generating schedule
   - Payment processing + order update
   - Any operation with multiple DB writes

2. **Caching**: Cache only for:
   - Public endpoints (schools, meal plans, menu items)
   - 5-10 minute TTL
   - Invalidate on create/update/delete

3. **Ownership Validation**: Always check for:
   - User-specific data (students, subscriptions, orders)
   - Admin-only operations
   - Cross-tenant data access

4. **Prisma Relations**: Use `connect` syntax:
   ```typescript
   // ✅ CORRECT
   student: { connect: { id: studentId } }
   
   // ❌ WRONG
   studentId: studentId
   ```

5. **Error Handling**:
   - `NotFoundException` (404): Entity not found
   - `BadRequestException` (400): Validation error
   - `ForbiddenException` (403): Access denied
   - `UnauthorizedException` (401): Not authenticated

---

## 🌐 Controller Pattern

### Controller Template with Complete Swagger

```typescript
// {module-name}.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { {ModuleName}Service } from './{module-name}.service';
import { Create{Entity}Dto, Update{Entity}Dto } from './dto';
import { CurrentUser, Public, Roles, UserRole } from '../common/decorators';

@ApiTags('{Module Display Name}')
@ApiBearerAuth()
@Controller({ path: '{module-path}', version: '1' })
export class {ModuleName}Controller {
  constructor(private readonly {moduleName}Service: {ModuleName}Service) {}

  /**
   * Create {entity}
   */
  @Post()
  @ApiOperation({
    summary: 'Create new {entity}',
    description: `
Creates a new {entity} with the provided information.

**Key Points:**
- Authenticated users only
- Validates all required fields
- Returns created {entity} with ID
    `.trim(),
  })
  @ApiResponse({
    status: 201,
    description: '{Entity} created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          fieldName: 'Example Value',
          createdAt: '2026-02-11T10:00:00.000Z',
          updatedAt: '2026-02-11T10:00:00.000Z',
        },
        timestamp: '2026-02-11T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error or invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createDto: Create{Entity}Dto,
  ) {
    return this.{moduleName}Service.create(userId, createDto);
  }

  /**
   * Get all {entities}
   */
  @Get()
  @Public() // If public endpoint
  @ApiOperation({
    summary: 'Get all {entities}',
    description: `
Retrieves a list of all {entities}.

**Features:**
- Public endpoint (no authentication required)
- Results are cached for 5 minutes
- Returns active {entities} only (not deleted)
    `.trim(),
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Optional filter parameter',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: '{Entities} retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            fieldName: 'Example Value',
            createdAt: '2026-02-11T10:00:00.000Z',
          },
        ],
        timestamp: '2026-02-11T10:00:00.000Z',
      },
    },
  })
  async findAll(@Query('filter') filter?: string) {
    return this.{moduleName}Service.findAll(filter);
  }

  /**
   * Get {entity} by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get {entity} by ID',
    description: 'Retrieves detailed information about a specific {entity}.',
  })
  @ApiParam({
    name: 'id',
    description: '{Entity} UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: '{Entity} found',
  })
  @ApiResponse({
    status: 404,
    description: '{Entity} not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.{moduleName}Service.findOne(id, userId);
  }

  /**
   * Update {entity}
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update {entity}',
    description: 'Updates {entity} information. Only {entity} owner can update.',
  })
  @ApiParam({
    name: 'id',
    description: '{Entity} UUID',
  })
  @ApiResponse({
    status: 200,
    description: '{Entity} updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: '{Entity} not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateDto: Update{Entity}Dto,
  ) {
    return this.{moduleName}Service.update(id, userId, updateDto);
  }

  /**
   * Delete {entity}
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete {entity}',
    description: 'Soft deletes {entity}. Data is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: '{Entity} UUID',
  })
  @ApiResponse({
    status: 200,
    description: '{Entity} deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: '{Entity} not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.{moduleName}Service.remove(id, userId);
  }
}
```

**Controller Critical Rules**:

1. **Swagger Documentation**:
   - Every endpoint has `@ApiOperation()` with summary + description
   - Every endpoint has `@ApiResponse()` for all status codes (200, 201, 400, 401, 403, 404)
   - Success responses include example schemas
   - All parameters have `@ApiParam()` or `@ApiQuery()` with examples

2. **Decorators**:
   - `@ApiTags()` - Groups endpoints in Swagger UI
   - `@ApiBearerAuth()` - Shows lock icon in Swagger
   - `@Public()` - Skips JWT authentication
   - `@Roles(UserRole.ADMIN)` - Admin-only access
   - `@CurrentUser('sub')` - Gets authenticated user ID

3. **Parameter Validation**:
   - Always use `ParseUUIDPipe` for UUID parameters
   - Use `ParseIntPipe` for integer parameters
   - Use DTO validation for body parameters

4. **API Versioning**:
   - All controllers use `version: '1'`
   - Accessible via `/api/v1/{path}`

---

## 🔐 Security Patterns

### Authentication & Authorization

**Common Decorators** (in `src/common/decorators/`):

```typescript
// roles.decorator.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// public.decorator.ts
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
```

**Usage Examples**:

```typescript
// Public endpoint (no auth required)
@Get()
@Public()
async getPublicData() {}

// Protected endpoint (auth required, default)
@Get('me')
async getProfile(@CurrentUser('sub') userId: string) {}

// Admin-only endpoint
@Post()
@Roles(UserRole.ADMIN)
async adminOnlyAction() {}

// Get full user object
@Get('profile')
async getFullProfile(@CurrentUser() user: any) {}
```

### Input Sanitization

**Global Pipe** (in `src/common/pipes/sanitize.pipe.ts`):

```typescript
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object') {
      Object.keys(value).forEach((key) => {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim();
        }
      });
    }
    return value;
  }
}
```

Applied globally in `app.module.ts`.

### Rate Limiting

**Configuration** (in `app.module.ts`):

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000, // 1 minute
  limit: 100, // 100 requests per minute (default)
}])
```

**Custom limits per endpoint**:

```typescript
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
async login() {}
```

---

## 🗄️ Database Patterns

### Prisma Best Practices

**1. Relations with `connect` syntax**:

```typescript
// ✅ CORRECT: Use connect for relations
await prisma.subscription.create({
  data: {
    student: { connect: { id: studentId } },
    mealPlan: { connect: { id: mealPlanId } },
    parent: { connect: { id: parentId } },
    // ... other fields
  },
});

// ❌ WRONG: Direct ID assignment (causes type errors)
await prisma.subscription.create({
  data: {
    studentId: studentId,
    mealPlanId: mealPlanId,
    // ... will cause TS errors
  },
});
```

**2. Transactions for multi-step operations**:

```typescript
// ✅ CORRECT: Use transactions
return await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'ACTIVE', paidAmount: { increment: order.amount } },
  });
  await tx.paymentTransaction.create({ data: transactionData });
  return order;
});
```

**3. Soft deletes**:

```typescript
// ✅ CORRECT: Soft delete
await prisma.student.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// ✅ Always filter in queries
await prisma.student.findMany({
  where: { deletedAt: null },
});

// ❌ WRONG: Hard delete
await prisma.student.delete({ where: { id } });
```

**4. Decimal type handling**:

```typescript
// ✅ CORRECT: Convert Decimal to number for arithmetic
const totalRevenue = orders.reduce(
  (sum, order) => sum + Number(order.amount),
  0
);

// ✅ CORRECT: Use Decimal for comparisons
if (Number(order.amount) === Number(subscription.totalPrice)) {
  // ...
}
```

**5. Include relations selectively**:

```typescript
// ✅ GOOD: Select only needed fields
const subscription = await prisma.subscription.findUnique({
  where: { id },
  include: {
    student: {
      select: { id: true, fullName: true, grade: true },
    },
    mealPlan: {
      select: { id: true, name: true, pricePerDay: true },
    },
  },
});

// ❌ BAD: Over-fetching
const subscription = await prisma.subscription.findUnique({
  where: { id },
  include: {
    student: true, // Gets all fields including unnecessary ones
    mealPlan: true,
  },
});
```

---

## 🚀 Common Utilities & Helpers

### Custom Decorators

**Location**: `src/common/decorators/`

```typescript
// @Public() - Skip authentication
// @Roles(UserRole.ADMIN) - Require specific role
// @CurrentUser('sub') - Get user ID from JWT
```

### Guards

**Location**: `src/common/guards/`

```typescript
// JwtAuthGuard - Applied globally, validates JWT
// RolesGuard - Applied globally, checks user roles
```

### Interceptors

**Location**: `src/common/interceptors/`

```typescript
// ResponseInterceptor - Wraps all responses in standard format:
{
  success: true,
  statusCode: 200,
  data: { /* actual data */ },
  timestamp: '2026-02-11T10:00:00.000Z'
}
```

### Pipes

**Location**: `src/common/pipes/`

```typescript
// SanitizePipe - Applied globally, trims strings
```

---

## 📊 Caching Strategy

### When to Cache

**✅ Cache these** (5-10 min TTL):
- Public endpoints: Schools list, Meal plans, Menu items
- CMS pages (published content)
- Dashboard stats (with shorter TTL)

**❌ Don't cache these**:
- User-specific data: Subscriptions, Orders, Students
- Real-time data: Delivery status, Payment status
- Admin operations: User management, Reports

### Cache Pattern

```typescript
// 1. Define cache keys as constants
private readonly CACHE_KEY_ALL = 'schools:all';
private readonly CACHE_KEY_BY_ID = 'schools:id:';
private readonly CACHE_TTL = 300; // 5 minutes

// 2. Check cache first
async findAll() {
  const cached = await this.cacheManager.get(this.CACHE_KEY_ALL);
  if (cached) return cached;

  const results = await this.prisma.school.findMany();
  
  await this.cacheManager.set(this.CACHE_KEY_ALL, results, this.CACHE_TTL);
  return results;
}

// 3. Invalidate on mutations
async update(id: string, data: UpdateSchoolDto) {
  const updated = await this.prisma.school.update({ where: { id }, data });
  
  // Invalidate related caches
  await this.cacheManager.del(this.CACHE_KEY_ALL);
  await this.cacheManager.del(`${this.CACHE_KEY_BY_ID}${id}`);
  
  return updated;
}
```

---

## 🔔 Background Jobs Pattern

### BullMQ Integration

**Queue Registration** (in module):

```typescript
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
})
```

**Producer (Adding jobs)**:

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async sendNotification(userId: string, message: string) {
    await this.notificationQueue.add('send-fcm', {
      userId,
      message,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

**Consumer (Processing jobs)**:

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('notifications')
export class NotificationProcessor {
  @Process('send-fcm')
  async handleSendFCM(job: Job) {
    const { userId, message } = job.data;
    // Send FCM notification
    await this.fcmProvider.send(userId, message);
  }
}
```

---

## 🧪 Testing Pattern

### E2E Test Template

**Location**: `apps/backend/test/{module}.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('{ModuleName}Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@1234',
      });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/{path}', () => {
    it('should create {entity} successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/{path}')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // test data
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      createdId = response.body.data.id;
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/{path}')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // invalid data
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/{path}', () => {
    it('should get all {entities}', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/{path}')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/{path}/:id', () => {
    it('should get {entity} by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/{path}/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(createdId);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/{path}/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/{path}/:id', () => {
    it('should update {entity}', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/{path}/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // update data
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/{path}/:id', () => {
    it('should delete {entity}', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/{path}/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
```

---

## ⚠️ Common Pitfalls & Solutions

### 1. TypeScript Errors with Prisma Relations

**Problem**: `Type 'string' is not assignable to type 'never'`

```typescript
// ❌ WRONG
await prisma.subscription.create({
  data: {
    studentId: studentId, // Error!
    mealPlanId: mealPlanId, // Error!
  },
});
```

**Solution**: Use `connect` syntax

```typescript
// ✅ CORRECT
await prisma.subscription.create({
  data: {
    student: { connect: { id: studentId } },
    mealPlan: { connect: { id: mealPlanId } },
  },
});
```

### 2. Decimal Type Arithmetic

**Problem**: Can't do math on Prisma `Decimal` type

```typescript
// ❌ WRONG
const total = orders.reduce((sum, order) => sum + order.amount, 0); // Error!
```

**Solution**: Convert to `number`

```typescript
// ✅ CORRECT
const total = orders.reduce((sum, order) => sum + Number(order.amount), 0);
```

### 3. Enum Conflicts

**Problem**: Two enums with same name (Prisma vs local)

```typescript
// In roles.decorator.ts
export enum UserRole { ADMIN = 'ADMIN', PARENT = 'PARENT' }

// From @prisma/client
export enum UserRole { PARENT, ADMIN, SCHOOL_ADMIN }
```

**Solution**: Import from correct source

```typescript
// For @Roles decorator - use local enum
import { UserRole } from '../common/decorators';
@Roles(UserRole.ADMIN)

// For Prisma queries - use Prisma enum
import { UserRole } from '@prisma/client';
const users = await prisma.user.findMany({ where: { role: UserRole.ADMIN } });
```

### 4. Missing CACHE_MANAGER

**Problem**: `Nest can't resolve dependencies of the XxxService (PrismaService, ?)`

**Solution**: Import CacheModule globally in `app.module.ts`

```typescript
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // Make it global
      ttl: 300,
      max: 100,
    }),
  ],
})
```

### 5. ESM vs CommonJS Package Errors

**Problem**: `require() of ES Module not supported`

**Solution**: Downgrade to CommonJS-compatible version

```json
// package.json
{
  "uuid": "^9.0.1" // Not ^13.0.0
}
```

---

## ✅ Module Implementation Checklist

When creating or modifying a module, verify:

### Files Structure
- [ ] Module file (`{module}.module.ts`) created
- [ ] Service file (`{module}.service.ts`) created
- [ ] Controller file (`{module}.controller.ts`) created
- [ ] DTOs created (`dto/create-*.dto.ts`, `dto/update-*.dto.ts`, `dto/index.ts`)
- [ ] Test spec created (`test/{module}.e2e-spec.ts`)

### Code Quality
- [ ] All DTOs have `class-validator` decorators
- [ ] All DTOs have `@ApiProperty()` with examples
- [ ] Service uses Prisma correctly (transactions, relations)
- [ ] Caching implemented for public endpoints
- [ ] Ownership validation for user-specific data
- [ ] Soft deletes implemented (`deletedAt`)
- [ ] Error handling with proper HTTP status codes

### Swagger Documentation
- [ ] Controller has `@ApiTags()`
- [ ] All endpoints have `@ApiOperation()` with description
- [ ] All endpoints have `@ApiResponse()` for all status codes
- [ ] Success responses include example schemas
- [ ] Parameters have `@ApiParam()` or `@ApiQuery()`
- [ ] Protected routes have `@ApiBearerAuth()`

### Integration
- [ ] Module imported in `app.module.ts`
- [ ] Module registered in correct imports order
- [ ] Dependencies properly injected
- [ ] No TypeScript errors
- [ ] Compiles successfully

---

## 🎯 Project-Specific Business Logic

### Subscription Engine

**Key Concepts**:
- Pre-generate all delivery dates when subscription is created
- Store in `SubscriptionDay` table with status
- Support pause: mark affected days as `PAUSED`, extend end date
- Immutable history: Never delete `SubscriptionDay` records

**Implementation**:
```typescript
// Generate schedule
const schedule = generateSchedule(startDate, endDate, operatingDays);

await prisma.$transaction(async (tx) => {
  const subscription = await tx.subscription.create({ data });
  
  await tx.subscriptionDay.createMany({
    data: schedule.map(date => ({
      subscriptionId: subscription.id,
      scheduledDate: date,
      status: 'SCHEDULED',
    })),
  });
});
```

### Pause Management

**Rules**:
- Parent requests pause with date range
- Admin approves/rejects
- On approval: Mark affected `SubscriptionDay` as `PAUSED`, extend subscription end date
- Calendar-based date selection in UI
- Server-driven schedule recalculation

### Payment Flow

**Razorpay Integration**:
1. Create order in backend
2. Return Razorpay order ID to frontend
3. Frontend shows Razorpay checkout
4. On success, verify signature and update order status
5. Use transactions to update order + subscription atomically

---

## 📝 Documentation Standards

### Code Comments

```typescript
/**
 * Create new subscription with pre-generated delivery schedule
 * 
 * This method:
 * 1. Validates student and meal plan
 * 2. Calculates total price and duration
 * 3. Generates delivery schedule based on school operating days
 * 4. Creates subscription and schedule records atomically
 * 
 * @param userId - Parent user ID
 * @param createDto - Subscription creation data
 * @returns Created subscription with schedule
 * @throws BadRequestException if student or meal plan not found
 * @throws ForbiddenException if user doesn't own the student
 */
async create(userId: string, createDto: CreateSubscriptionDto) {
  // Implementation
}
```

### Swagger Examples

```typescript
@ApiResponse({
  status: 201,
  description: 'Subscription created successfully',
  schema: {
    example: {
      success: true,
      statusCode: 201,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subscriptionNumber: 'SUB-2026-0001',
        status: 'PENDING_PAYMENT',
        startDate: '2026-02-15',
        endDate: '2026-03-16',
        totalDays: 30,
        totalPrice: 300000, // 3000 INR in paise
        student: {
          id: '...',
          fullName: 'John Doe',
        },
        mealPlan: {
          id: '...',
          name: 'Standard Lunch Plan',
          pricePerDay: 10000,
        },
      },
      timestamp: '2026-02-11T10:00:00.000Z',
    },
  },
})
```

---

## 🚨 Critical "DO NOT" Rules

1. **❌ DO NOT use `any` type** - Always specify proper types
2. **❌ DO NOT hard delete data** - Always use soft deletes (`deletedAt`)
3. **❌ DO NOT skip transactions** - Use for multi-step operations
4. **❌ DO NOT skip validation** - Every DTO must have validators
5. **❌ DO NOT skip Swagger docs** - Every endpoint must be documented
6. **❌ DO NOT expose sensitive data** - Filter passwords, tokens in responses
7. **❌ DO NOT skip ownership checks** - Validate user owns the resource
8. **❌ DO NOT cache user-specific data** - Only cache public endpoints
9. **❌ DO NOT use direct ID assignment** - Use Prisma `connect` syntax
10. **❌ DO NOT skip error handling** - Use proper HTTP exceptions

---

## 🎓 Learning from Existing Code

### Study These Implementations

**Best Examples**:
- `src/auth/` - Complete auth flow with OTP, JWT, refresh tokens
- `src/subscriptions/` - Complex business logic with transactions
- `src/schools/` - Caching strategy
- `src/payments/` - Razorpay integration
- `src/admin/` - Dashboard stats aggregation

**Key Files**:
- `src/app.module.ts` - Global module configuration
- `src/common/` - Reusable decorators, guards, interceptors
- `prisma/schema.prisma` - Database schema

---

## 🔄 Development Workflow

### Step-by-Step Module Creation

1. **Plan**: Review requirements in `/TASKS/` and `/docs/`
2. **Schema**: Ensure Prisma schema is correct
3. **Generate**: Run `prisma generate` if schema changed
4. **Create**: Module → DTOs → Service → Controller
5. **Document**: Add complete Swagger documentation
6. **Test**: Create test spec (even if not executing yet)
7. **Integrate**: Add to `app.module.ts`
8. **Verify**: No TypeScript errors, compiles successfully
9. **Run**: Test in Swagger UI at `/api/docs`

### Before Committing

- [ ] No TypeScript errors
- [ ] All imports organized
- [ ] No unused variables
- [ ] Proper error handling
- [ ] Swagger docs complete
- [ ] Follows established patterns

---

## 📚 Quick Reference

### Common Imports

```typescript
// NestJS Core
import { Injectable, Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

// Validation
import { IsString, IsEmail, IsUUID, IsOptional, MinLength, MaxLength, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Prisma
import { PrismaService } from '../prisma/prisma.service';

// Caching
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

// Custom
import { CurrentUser, Public, Roles, UserRole } from '../common/decorators';
import { ParseUUIDPipe } from '@nestjs/common';
```

### Common Exceptions

```typescript
import { NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

throw new NotFoundException('Resource not found');
throw new BadRequestException('Invalid input data');
throw new ForbiddenException('Access denied');
throw new UnauthorizedException('Authentication required');
```

---

## 🎯 Success Criteria

An AI agent working with this guide should:

✅ Create consistent, high-quality code  
✅ Follow established patterns exactly  
✅ Write complete Swagger documentation  
✅ Implement proper security measures  
✅ Use transactions, caching, and error handling correctly  
✅ Produce code that compiles without errors  
✅ Maintain architectural consistency  
✅ Write testable, maintainable code  

---

**This guide is the single source of truth for maintaining code quality and architectural consistency in the School Tiffin Platform project.**

**Version**: 1.0  
**Last Updated**: February 11, 2026  
**Maintained By**: Project Team
