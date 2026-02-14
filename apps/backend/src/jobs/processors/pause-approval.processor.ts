import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PauseRequestStatus } from '@prisma/client';

@Processor('pause-approval')
export class PauseApprovalProcessor {
  private readonly logger = new Logger(PauseApprovalProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process approved pause request
   * Updates subscription schedule
   */
  @Process('process-pause')
  async handlePauseProcessing(job: Job<{ pauseRequestId: string }>) {
    const { pauseRequestId } = job.data;

    this.logger.log(`Processing pause request: ${pauseRequestId}`);

    try {
      const pauseRequest = await this.prisma.pauseRequest.findUnique({
        where: { id: pauseRequestId },
        include: {
          subscription: {
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
          },
        },
      });

      if (!pauseRequest || pauseRequest.status !== PauseRequestStatus.APPROVED) {
        throw new Error('Invalid pause request');
      }

      // Process pause with transaction
      await this.prisma.$transaction(async (tx) => {
        // 1. Update subscription_days to PAUSED
        await tx.subscriptionDay.updateMany({
          where: {
            subscriptionId: pauseRequest.subscriptionId,
            scheduledDate: {
              gte: pauseRequest.startDate,
              lte: pauseRequest.endDate,
            },
            status: 'SCHEDULED',
          },
          data: {
            status: 'PAUSED',
          },
        });

        // 2. Extend subscription end date
        await tx.subscription.update({
          where: { id: pauseRequest.subscriptionId },
          data: {
            endDate: pauseRequest.newEndDate,
          },
        });

        // 3. Create new subscription_days for the extension
        // Get subscription details
        const subscription = await tx.subscription.findUnique({
          where: { id: pauseRequest.subscriptionId },
          include: {
            student: {
              select: {
                schoolId: true,
              },
            },
          },
        });

        // Generate new schedule for extended days
        // (In a real implementation, use the schedule generator service)
        // For now, we'll mark this as a TODO
        this.logger.log('TODO: Generate new subscription days for extended period');

        // 4. Mark pause request as processed
        await tx.pauseRequest.update({
          where: { id: pauseRequestId },
          data: {
            status: PauseRequestStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
      });

      // Send notification to parent
      const parent = pauseRequest.subscription.student.parent;
      const studentName = pauseRequest.subscription.student.fullName;

      const title = 'Pause Request Processed';
      const body = `Your pause request for ${studentName}'s subscription has been processed. Subscription extended to ${pauseRequest.newEndDate.toLocaleDateString()}.`;

      await this.notificationsService.sendToUser(
        parent.id,
        title,
        body,
        { type: 'PAUSE_PROCESSED', pauseRequestId },
        true, // Push notification
        true, // Email
        false, // SMS
      );

      this.logger.log(`Pause request ${pauseRequestId} processed successfully`);

      return {
        success: true,
        pauseRequestId,
        affectedDays: pauseRequest.affectedDays,
      };
    } catch (error) {
      this.logger.error(`Failed to process pause request: ${error.message}`);
      throw error;
    }
  }
}
