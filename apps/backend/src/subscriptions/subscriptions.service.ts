import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionEngineService } from './subscription-engine.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionEngine: SubscriptionEngineService,
  ) {}

  /**
   * Create a new subscription with database transaction
   */
  async create(parentId: string, createSubscriptionDto: CreateSubscriptionDto) {
    const {
      studentId,
      mealPlanId,
      startDate: startDateString,
      numberOfDays,
    } = createSubscriptionDto;

    // Verify student belongs to parent
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        parentId,
        deletedAt: null,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            operatingDays: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found or does not belong to you');
    }

    // Verify meal plan belongs to student's school
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        schoolId: student.schoolId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!mealPlan) {
      throw new BadRequestException('Meal plan not found or not available for this school');
    }

    // Parse and validate start date
    const startDate = new Date(startDateString);
    this.subscriptionEngine.validateSubscriptionDates(startDate, numberOfDays);

    // Generate delivery schedule
    const { schedule, endDate } = await this.subscriptionEngine.generateSchedule(
      student.schoolId,
      startDate,
      numberOfDays,
    );

    // Calculate total price
    const totalPrice = await this.subscriptionEngine.calculatePrice(mealPlanId, numberOfDays);

    // Generate subscription number
    const subscriptionNumber = this.subscriptionEngine.generateSubscriptionNumber();

    // Create subscription with transaction
    const result = await this.prisma.$transaction(async tx => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          parent: { connect: { id: parentId } },
          student: { connect: { id: studentId } },
          school: { connect: { id: student.schoolId } },
          mealPlan: { connect: { id: mealPlanId } },
          startDate,
          endDate,
          totalDays: numberOfDays,
          remainingDays: numberOfDays,
          totalPrice,
          currency: mealPlan.currency,
          status: SubscriptionStatus.PENDING_PAYMENT,
        },
      });

      // Create subscription days (bulk insert)
      const subscriptionDaysData = schedule.map(date => ({
        subscriptionId: subscription.id,
        scheduledDate: date,
        status: 'SCHEDULED' as const,
      }));

      await tx.subscriptionDay.createMany({
        data: subscriptionDaysData,
      });

      // Return subscription with related data
      return await tx.subscription.findUnique({
        where: { id: subscription.id },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              grade: true,
            },
          },
          mealPlan: {
            select: {
              id: true,
              name: true,
              pricePerDay: true,
              currency: true,
            },
          },
        },
      });
    });

    return result;
  }

  /**
   * Get all subscriptions for a parent
   */
  async findAllByParent(parentId: string, status?: SubscriptionStatus) {
    // Get all students for this parent
    const students = await this.prisma.student.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const studentIds = students.map(s => s.id);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        studentId: { in: studentIds },
        ...(status && { status }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        mealPlan: {
          select: {
            id: true,
            name: true,
            pricePerDay: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions;
  }

  /**
   * Get subscription by ID
   */
  async findOne(id: string, parentId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
            parentId: true,
            school: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        mealPlan: {
          select: {
            id: true,
            name: true,
            description: true,
            pricePerDay: true,
            currency: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify ownership
    if (subscription.student.parentId !== parentId) {
      throw new ForbiddenException('Access denied');
    }

    return subscription;
  }

  /**
   * Get subscription schedule
   */
  async getSchedule(id: string, parentId: string) {
    // Verify ownership
    await this.findOne(id, parentId);

    const schedule = await this.prisma.subscriptionDay.findMany({
      where: { subscriptionId: id },
      orderBy: { scheduledDate: 'asc' },
    });

    return schedule;
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, parentId: string) {
    // Verify ownership and get subscription
    const subscription = await this.findOne(id, parentId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    if (subscription.status === SubscriptionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed subscription');
    }

    // Calculate refund (simple logic: refund remaining days)
    const refundAmount = Math.floor(
      (subscription.remainingDays / subscription.totalDays) * Number(subscription.totalPrice),
    );

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    return {
      ...updated,
      refundAmount,
      message: 'Subscription cancelled successfully',
    };
  }
}
