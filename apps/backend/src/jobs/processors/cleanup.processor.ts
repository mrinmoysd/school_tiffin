import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('cleanup')
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cleanup old read notifications
   * Runs weekly
   */
  @Process('cleanup-old-notifications')
  async handleCleanupNotifications(job: Job) {
    this.logger.log('Cleaning up old notifications...');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old notifications`);

      return {
        success: true,
        deletedCount: result.count,
      };
    } catch (error) {
      this.logger.error(`Failed to cleanup notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cleanup expired refresh tokens
   * Runs daily
   */
  @Process('cleanup-expired-tokens')
  async handleCleanupTokens(job: Job) {
    this.logger.log('Cleaning up expired tokens...');

    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { isRevoked: true },
            { expiresAt: { lt: new Date() } },
          ],
        },
      });

      this.logger.log(`Deleted ${result.count} expired/revoked tokens`);

      return {
        success: true,
        deletedCount: result.count,
      };
    } catch (error) {
      this.logger.error(`Failed to cleanup tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive completed subscriptions
   * Runs monthly
   */
  @Process('archive-completed-subscriptions')
  async handleArchiveSubscriptions(job: Job) {
    this.logger.log('Archiving old completed subscriptions...');

    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // In a real implementation, move to archive table or cold storage
      // For now, just count them
      const count = await this.prisma.subscription.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            lt: oneYearAgo,
          },
        },
      });

      this.logger.log(`Found ${count} subscriptions older than 1 year`);

      // TODO: Implement actual archival logic
      // This could involve moving data to a separate archive table
      // or exporting to cold storage like S3 Glacier

      return {
        success: true,
        subscriptionsFound: count,
        archived: false, // Set to true when actual archival is implemented
      };
    } catch (error) {
      this.logger.error(`Failed to archive subscriptions: ${error.message}`);
      throw error;
    }
  }
}
