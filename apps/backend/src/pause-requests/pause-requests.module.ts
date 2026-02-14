import { Module } from '@nestjs/common';
import { PauseRequestsController } from './pause-requests.controller';
import { PauseRequestsService } from './pause-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [PauseRequestsController],
  providers: [PauseRequestsService],
  exports: [PauseRequestsService],
})
export class PauseRequestsModule {}
