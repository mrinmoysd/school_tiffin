import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DailyDeliveryProcessor } from './processors/daily-delivery.processor';
import { SubscriptionExpiryProcessor } from './processors/subscription-expiry.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { PauseApprovalProcessor } from './processors/pause-approval.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    NotificationsModule,
    
    // BullMQ configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Define job queues
    BullModule.registerQueue(
      { name: 'daily-delivery' },
      { name: 'subscription-expiry' },
      { name: 'cleanup' },
      { name: 'pause-approval' },
    ),

    // Bull Board for monitoring
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      {
        name: 'daily-delivery',
        adapter: BullAdapter,
      },
      {
        name: 'subscription-expiry',
        adapter: BullAdapter,
      },
      {
        name: 'cleanup',
        adapter: BullAdapter,
      },
      {
        name: 'pause-approval',
        adapter: BullAdapter,
      },
    ),
  ],
  providers: [
    DailyDeliveryProcessor,
    SubscriptionExpiryProcessor,
    CleanupProcessor,
    PauseApprovalProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
