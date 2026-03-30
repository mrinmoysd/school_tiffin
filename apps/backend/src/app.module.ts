import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { CmsModule } from './cms/cms.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { MealPlanTypesModule } from './meal-plan-types/meal-plan-types.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { OtpModule } from './otp/otp.module';
import { PauseRequestsModule } from './pause-requests/pause-requests.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
      envFilePath: ['apps/backend/.env.local', 'apps/backend/.env', '.env.local', '.env'],
    }),

    // Cache Manager (global)
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL (in seconds)
      max: 100, // Maximum number of items in cache
    }),

    // Rate limiting (global)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (default)
      },
    ]),

    // Structured logging
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
        serializers: {
          req: req => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
              host: req.headers.host,
              'user-agent': req.headers['user-agent'],
            },
          }),
          res: res => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),

    // Feature modules
    PrismaModule,
    AdminModule,
    AuthModule,
    AppSettingsModule,
    CmsModule,
    UsersModule,
    StudentsModule,
    SchoolsModule,
    MealPlanTypesModule,
    MealPlansModule,
    MenuItemsModule,
    SubscriptionsModule,
    PauseRequestsModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    UploadsModule,
    JobsModule,
    HealthModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT auth by default
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Role-based access control
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor, // Standard response format
    },
    // Global pipes
    {
      provide: APP_PIPE,
      useClass: SanitizePipe, // Input sanitization
    },
  ],
})
export class AppModule {}
