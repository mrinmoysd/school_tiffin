import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto } from './dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Register FCM token
   */
  @Post('register-token')
  @ApiOperation({
    summary: 'Register FCM device token',
    description: 'Register device token for push notifications. Used by mobile app.',
  })
  @ApiResponse({ status: 201, description: 'Token registered successfully' })
  async registerToken(
    @CurrentUser('sub') userId: string,
    @Body() registerFcmTokenDto: RegisterFcmTokenDto,
  ) {
    return this.notificationsService.registerFcmToken(userId, registerFcmTokenDto);
  }

  /**
   * Get all notifications
   */
  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description: 'List all notifications for the authenticated user. Limited to last 50.',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Show only unread notifications',
  })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true })) unreadOnly?: boolean,
  ) {
    return this.notificationsService.findAllByUser(userId, unreadOnly);
  }

  /**
   * Get unread count
   */
  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get the count of unread notifications for badge display.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: { unreadCount: 5 },
      },
    },
  })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
  })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * Mark all as read
   */
  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
