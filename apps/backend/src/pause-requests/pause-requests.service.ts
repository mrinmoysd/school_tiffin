import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PauseRequestStatus } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionEngineService } from '../subscriptions/subscription-engine.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePauseRequestDto } from './dto/create-pause-request.dto';

@Injectable()
export class PauseRequestsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
    private subscriptionEngine: SubscriptionEngineService,
  ) {}

  /**
   * Create a pause request
   */
  async create(parentId: string, createPauseRequestDto: CreatePauseRequestDto) {
    const {
      subscriptionId,
      startDate: startDateString,
      endDate: endDateString,
      reason,
    } = createPauseRequestDto;

    // Verify subscription ownership
    const subscription = await this.subscriptionsService.findOne(subscriptionId, parentId);

    // Check subscription is active
    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Can only pause active subscriptions');
    }

    // Parse dates
    const startDate = startOfDay(new Date(startDateString));
    const endDate = startOfDay(new Date(endDateString));
    const now = startOfDay(new Date());

    // Validate dates
    if (startDate < now) {
      throw new BadRequestException('Pause start date cannot be in the past');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Pause end date must be after start date');
    }

    if (startDate < subscription.startDate || endDate > subscription.endDate) {
      throw new BadRequestException('Pause dates must be within subscription period');
    }

    // Check for overlapping pause requests
    const overlapping = await this.prisma.pauseRequest.findFirst({
      where: {
        subscriptionId,
        status: {
          in: [
            PauseRequestStatus.PENDING,
            PauseRequestStatus.APPROVED,
            PauseRequestStatus.PROCESSED,
          ],
        },
        OR: [
          {
            AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }],
          },
          {
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
          },
          {
            AND: [{ startDate: { gte: startDate } }, { endDate: { lte: endDate } }],
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Overlapping pause request exists');
    }

    // Calculate affected days (count only scheduled operating days)
    const subscriptionDays = await this.prisma.subscriptionDay.findMany({
      where: {
        subscriptionId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SCHEDULED',
      },
    });

    const affectedDays = subscriptionDays.length;

    if (affectedDays === 0) {
      throw new BadRequestException('No scheduled days found in this date range');
    }

    // Calculate new end date (extend by affected days)
    const newEndDate = addDays(subscription.endDate, affectedDays);

    // Create pause request
    const pauseRequest = await this.prisma.pauseRequest.create({
      data: {
        subscription: { connect: { id: subscriptionId } },
        parent: { connect: { id: parentId } },
        startDate,
        endDate,
        reason,
        pauseDays: affectedDays,
        affectedDays,
        newEndDate,
        status: PauseRequestStatus.PENDING,
      },
      include: {
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      ...pauseRequest,
      impact: {
        daysAffected: affectedDays,
        currentEndDate: subscription.endDate,
        newEndDate,
        extensionDays: affectedDays,
      },
    };
  }

  /**
   * Get all pause requests for a parent
   */
  async findAllByParent(parentId: string, status?: PauseRequestStatus) {
    // Get all subscriptions for this parent
    const subscriptions = await this.subscriptionsService.findAllByParent(parentId);
    const subscriptionIds = subscriptions.map(s => s.id);

    const pauseRequests = await this.prisma.pauseRequest.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
        ...(status && { status }),
      },
      include: {
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pauseRequests;
  }

  /**
   * Cancel a pending pause request
   */
  async cancel(id: string, parentId: string) {
    const pauseRequest = await this.prisma.pauseRequest.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            student: {
              select: {
                parentId: true,
              },
            },
          },
        },
      },
    });

    if (!pauseRequest) {
      throw new NotFoundException('Pause request not found');
    }

    // Verify ownership
    if (pauseRequest.subscription.student.parentId !== parentId) {
      throw new ForbiddenException('Access denied');
    }

    // Can only cancel pending requests
    if (pauseRequest.status !== PauseRequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending pause requests');
    }

    await this.prisma.pauseRequest.delete({
      where: { id },
    });

    return { message: 'Pause request cancelled successfully' };
  }

  /**
   * Admin: Update pause request status
   */
  async updateStatus(id: string, status: PauseRequestStatus) {
    const pauseRequest = await this.prisma.pauseRequest.findUnique({
      where: { id },
    });

    if (!pauseRequest) {
      throw new NotFoundException('Pause request not found');
    }

    if (pauseRequest.status !== PauseRequestStatus.PENDING) {
      throw new BadRequestException('Can only approve/reject pending requests');
    }

    const updated = await this.prisma.pauseRequest.update({
      where: { id },
      data: {
        status,
        processedAt: status === PauseRequestStatus.REJECTED ? new Date() : undefined,
      },
    });

    // If approved, queue processing job (will be implemented with BullMQ)
    if (status === PauseRequestStatus.APPROVED) {
      // TODO: Queue pause processing job
      // await this.pauseQueue.add('process-pause', { pauseRequestId: id });
    }

    return updated;
  }
}
