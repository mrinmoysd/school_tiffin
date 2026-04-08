import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { startOfDay, endOfDay, format } from 'date-fns';

const getStudentName = (student: { firstName?: string | null; lastName?: string | null }) =>
  [student.firstName, student.lastName].filter(Boolean).join(' ').trim();

@Processor('daily-delivery')
export class DailyDeliveryProcessor {
  private readonly logger = new Logger(DailyDeliveryProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process daily delivery notifications
   * Runs daily at 6 AM
   */
  @Process('generate-daily-deliveries')
  async handleDailyDeliveries() {
    this.logger.log('Processing daily deliveries...');

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    try {
      // Get today's scheduled deliveries
      const deliveries = await this.prisma.subscriptionDay.findMany({
        where: {
          scheduledDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: 'SCHEDULED',
        },
        include: {
          subscription: {
            include: {
              student: {
                include: {
                  parent: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phoneNumber: true,
                    },
                  },
                  school: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              mealPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${deliveries.length} deliveries for today`);

      // Send notifications to parents
      for (const delivery of deliveries) {
        const parent = delivery.subscription.student.parent;
        const studentName = getStudentName(delivery.subscription.student);
        const schoolName = delivery.subscription.student.school.name;
        const mealPlanName = delivery.subscription.mealPlan.name;

        const title = 'Delivery Scheduled Today';
        const body = `Tiffin delivery for ${studentName} at ${schoolName} - ${mealPlanName}`;

        // Send notification
        await this.notificationsService.sendToUser(
          parent.id,
          title,
          body,
          { type: 'DELIVERY_REMINDER', deliveryId: delivery.id },
          true, // Push notification
          false, // Email
          false, // SMS
        );
      }

      this.logger.log('Daily delivery processing completed');

      return {
        success: true,
        deliveriesProcessed: deliveries.length,
        date: format(today, 'yyyy-MM-dd'),
      };
    } catch (error) {
      this.logger.error(`Failed to process daily deliveries: ${error.message}`);
      throw error;
    }
  }
}
