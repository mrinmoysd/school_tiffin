import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionStatus } from '@prisma/client';

const getStudentName = (student: { firstName?: string | null; lastName?: string | null }) =>
  [student.firstName, student.lastName].filter(Boolean).join(' ').trim();

@Processor('subscription-expiry')
export class SubscriptionExpiryProcessor {
  private readonly logger = new Logger(SubscriptionExpiryProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Check and mark expired subscriptions as completed
   * Runs daily at 11:59 PM
   */
  @Process('check-subscription-expiry')
  async handleSubscriptionExpiry() {
    this.logger.log('Checking for expired subscriptions...');

    try {
      // Find active subscriptions with 0 remaining days
      const expiredSubscriptions = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          remainingDays: {
            lte: 0,
          },
        },
        include: {
          student: {
            include: {
              parent: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      // Mark as completed and send notifications
      for (const subscription of expiredSubscriptions) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        const parent = subscription.student.parent;
        const studentName = getStudentName(subscription.student);

        const title = 'Subscription Completed';
        const body = `Subscription ${subscription.subscriptionNumber} for ${studentName} has been completed.`;

        // Send notification
        await this.notificationsService.sendToUser(
          parent.id,
          title,
          body,
          { type: 'SUBSCRIPTION_COMPLETED', subscriptionId: subscription.id },
          true, // Push notification
          true, // Email
          false, // SMS
        );
      }

      this.logger.log('Subscription expiry check completed');

      return {
        success: true,
        subscriptionsCompleted: expiredSubscriptions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to check subscription expiry: ${error.message}`);
      throw error;
    }
  }
}
