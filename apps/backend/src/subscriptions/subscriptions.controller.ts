import { Controller, Get, Post, Body, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto';
import { CurrentUser } from '../common/decorators';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Create a new subscription
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new subscription',
    description:
      'Create a subscription for a student. Generates delivery schedule automatically based on school operating days. Uses database transaction for data consistency.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully with delivery schedule',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: '880e8400-e29b-41d4-a716-446655440000',
          subscriptionNumber: 'SUB-1707484800000-1234',
          studentId: '550e8400-e29b-41d4-a716-446655440000',
          mealPlanId: '660e8400-e29b-41d4-a716-446655440000',
          startDate: '2026-02-10T00:00:00.000Z',
          endDate: '2026-03-25T00:00:00.000Z',
          totalDays: 30,
          remainingDays: 30,
          totalPrice: 300000,
          currency: 'INR',
          status: 'PENDING_PAYMENT',
          student: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            firstName: 'Jane',
            lastName: 'Doe',
            grade: 5,
          },
          mealPlan: {
            id: '660e8400-e29b-41d4-a716-446655440000',
            name: 'Standard Meal Plan',
            pricePerDay: 10000,
            currency: 'INR',
          },
          createdAt: '2026-02-09T10:00:00.000Z',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or business rule violation' })
  @ApiResponse({ status: 404, description: 'Student or meal plan not found' })
  async create(
    @CurrentUser('sub') parentId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(parentId, createSubscriptionDto);
  }

  /**
   * Get all subscriptions for current parent
   */
  @Get()
  @ApiOperation({
    summary: 'Get all subscriptions',
    description: 'List all subscriptions for the authenticated parent. Can filter by status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: 'Filter by subscription status',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions list retrieved successfully',
  })
  async findAll(
    @CurrentUser('sub') parentId: string,
    @Query('status') status?: SubscriptionStatus,
  ) {
    return this.subscriptionsService.findAllByParent(parentId, status);
  }

  /**
   * Get subscription by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get subscription by ID',
    description:
      'Get detailed information about a specific subscription including student and meal plan details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscription UUID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Subscription found' })
  @ApiResponse({ status: 403, description: 'Access denied - subscription does not belong to you' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.subscriptionsService.findOne(id, parentId);
  }

  /**
   * Get subscription delivery schedule
   */
  @Get(':id/schedule')
  @ApiOperation({
    summary: 'Get subscription schedule',
    description:
      'Get the complete delivery schedule for a subscription showing all scheduled dates and their status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscription UUID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '990e8400-e29b-41d4-a716-446655440000',
            subscriptionId: '880e8400-e29b-41d4-a716-446655440000',
            scheduledDate: '2026-02-10T00:00:00.000Z',
            status: 'SCHEDULED',
            deliveredAt: null,
          },
          {
            id: '991e8400-e29b-41d4-a716-446655440000',
            subscriptionId: '880e8400-e29b-41d4-a716-446655440000',
            scheduledDate: '2026-02-11T00:00:00.000Z',
            status: 'SCHEDULED',
            deliveredAt: null,
          },
        ],
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.subscriptionsService.getSchedule(id, parentId);
  }

  /**
   * Cancel subscription
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel subscription',
    description:
      'Cancel an active subscription. Calculates refund amount based on remaining days. Cannot cancel completed subscriptions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscription UUID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '880e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          cancelledAt: '2026-02-09T10:00:00.000Z',
          refundAmount: 150000,
          message: 'Subscription cancelled successfully',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel - subscription already cancelled or completed',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.subscriptionsService.cancel(id, parentId);
  }
}
