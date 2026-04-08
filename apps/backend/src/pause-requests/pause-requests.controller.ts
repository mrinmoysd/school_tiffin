import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PauseRequestStatus } from '@prisma/client';
import { CurrentUser, Roles, UserRole } from '../common/decorators';
import { CreatePauseRequestDto } from './dto';
import { PauseRequestsService } from './pause-requests.service';

@ApiTags('Pause Requests')
@ApiBearerAuth()
@Controller({ path: 'pause-requests', version: '1' })
export class PauseRequestsController {
  constructor(private readonly pauseRequestsService: PauseRequestsService) {}

  /**
   * Create a pause request
   */
  @Post()
  @ApiOperation({
    summary: 'Create a pause request',
    description:
      'Request to pause a subscription for a specific date range. Automatically calculates affected days and new end date.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pause request created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: 'aa0e8400-e29b-41d4-a716-446655440000',
          subscriptionId: '880e8400-e29b-41d4-a716-446655440000',
          startDate: '2026-02-15T00:00:00.000Z',
          endDate: '2026-02-20T00:00:00.000Z',
          reason: 'Family vacation',
          affectedDays: 4,
          newEndDate: '2026-03-29T00:00:00.000Z',
          status: 'PENDING',
          subscription: {
            subscriptionNumber: 'SUB-1707484800000-1234',
            student: {
              firstName: 'Jane',
              lastName: 'Doe',
            },
          },
          impact: {
            daysAffected: 4,
            currentEndDate: '2026-03-25T00:00:00.000Z',
            newEndDate: '2026-03-29T00:00:00.000Z',
            extensionDays: 4,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid dates or overlapping pause request' })
  async create(
    @CurrentUser('sub') parentId: string,
    @Body() createPauseRequestDto: CreatePauseRequestDto,
  ) {
    return this.pauseRequestsService.create(parentId, createPauseRequestDto);
  }

  /**
   * Get all pause requests for current parent
   */
  @Get()
  @ApiOperation({
    summary: 'Get all pause requests',
    description: 'List all pause requests for the authenticated parent.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PauseRequestStatus,
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Pause requests retrieved successfully' })
  async findAll(
    @CurrentUser('sub') parentId: string,
    @Query('status') status?: PauseRequestStatus,
  ) {
    return this.pauseRequestsService.findAllByParent(parentId, status);
  }

  /**
   * Cancel a pending pause request
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel a pause request',
    description: 'Cancel a pending pause request. Only works for PENDING requests.',
  })
  @ApiParam({
    name: 'id',
    description: 'Pause Request UUID',
  })
  @ApiResponse({ status: 200, description: 'Pause request cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Can only cancel pending requests' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.pauseRequestsService.cancel(id, parentId);
  }

  /**
   * Admin: Update pause request status
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[Admin] Approve or reject pause request',
    description:
      'Admin only: Approve or reject a pause request. Approved requests will be processed in background.',
  })
  @ApiParam({
    name: 'id',
    description: 'Pause Request UUID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['APPROVED', 'REJECTED'],
          example: 'APPROVED',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PauseRequestStatus,
  ) {
    return this.pauseRequestsService.updateStatus(id, status);
  }
}
