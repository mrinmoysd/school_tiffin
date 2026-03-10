import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DeliveryStatus,
  OrderStatus,
  PauseRequestStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { Response } from 'express';
import { Roles, UserRole } from '../common/decorators';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get dashboard statistics
   */
  @Get('dashboard')
  @ApiOperation({
    summary: '[Admin] Get dashboard statistics',
    description:
      'Get comprehensive dashboard statistics including active subscriptions, deliveries, revenue, and more. Cached for 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          activeSubscriptions: 245,
          todayDeliveries: 187,
          monthlyRevenue: 2450000,
          pendingPauseRequests: 12,
          activeSchools: 15,
          totalUsers: 523,
          pendingOrders: 8,
          lastUpdated: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('recent-activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  /**
   * Get deliveries by date and school
   */
  @Get('deliveries')
  @ApiOperation({
    summary: '[Admin] Get deliveries',
    description:
      'Get deliveries filtered by date and/or school. Returns deliveries grouped by school.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'Filter by school UUID',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (ISO format). Defaults to today.',
    example: '2026-02-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Deliveries retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          date: '2026-02-10T00:00:00.000Z',
          totalDeliveries: 187,
          bySchool: {
            'ABC School': [
              {
                id: 'delivery-uuid',
                scheduledDate: '2026-02-10T00:00:00.000Z',
                status: 'SCHEDULED',
                subscription: {
                  subscriptionNumber: 'SUB-xxx',
                  student: {
                    fullName: 'John Doe',
                    grade: 5,
                    section: 'A',
                  },
                  mealPlan: {
                    name: 'Standard Plan',
                  },
                },
              },
            ],
          },
        },
      },
    },
  })
  async getDeliveries(
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId?: string,
    @Query('date') date?: string,
  ) {
    return this.adminService.getDeliveries(schoolId, date);
  }

  @Post('deliveries/mark-delivered')
  async markDeliveriesDelivered(@Body('deliveryIds') deliveryIds: string[]) {
    if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      throw new BadRequestException('deliveryIds must be a non-empty array');
    }
    return this.adminService.markDeliveriesDelivered(deliveryIds);
  }

  /**
   * Update delivery status
   */
  @Patch('deliveries/:id/status')
  @ApiOperation({
    summary: '[Admin] Update delivery status',
    description:
      'Mark delivery as delivered or cancelled. Updates subscription remaining days if delivered.',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery (SubscriptionDay) UUID',
  })
  @ApiQuery({
    name: 'status',
    enum: DeliveryStatus,
    description: 'New delivery status',
  })
  @ApiResponse({ status: 200, description: 'Delivery status updated successfully' })
  async updateDeliveryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: DeliveryStatus,
  ) {
    return this.adminService.updateDeliveryStatus(id, status);
  }

  @Get('deliveries/export')
  async exportDeliveries(
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId: string | undefined,
    @Query('date') date: string | undefined,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportDeliveriesCsv(schoolId, date);
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="deliveries-export.${ext}"`);
    return res.status(200).send(csv);
  }

  @Get('orders')
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getOrders(status, search, startDate, endDate);
  }

  @Get('orders/export')
  async exportOrders(
    @Query('status') status: OrderStatus | undefined,
    @Query('search') search: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportOrdersCsv(status, search, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    return res.status(200).send(csv);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderById(id);
  }

  @Get('subscriptions')
  async getSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getSubscriptions(status, schoolId, search, startDate, endDate);
  }

  @Get('subscriptions/:id')
  async getSubscriptionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getSubscriptionById(id);
  }

  @Get('subscriptions/:id/schedule')
  async getSubscriptionSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getSubscriptionSchedule(id);
  }

  @Delete('subscriptions/:id')
  async cancelSubscription(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.cancelSubscription(id);
  }

  @Get('pause-requests')
  async getPauseRequests(
    @Query('status') status?: PauseRequestStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPauseRequests(status, search, startDate, endDate);
  }

  @Get('pause-requests/:id')
  async getPauseRequestById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getPauseRequestById(id);
  }

  @Patch('pause-requests/:id/status')
  async updatePauseRequestStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PauseRequestStatus,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.updatePauseRequestStatus(id, status, reason);
  }

  /**
   * Get all users
   */
  @Get('users')
  @ApiOperation({
    summary: '[Admin] Get all users',
    description: 'Get paginated list of users with filters for role and search.',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, or phone' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Pagination skip',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Pagination take',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          users: [
            {
              id: 'user-uuid',
              fullName: 'Jane Doe',
              email: 'jane@example.com',
              phoneNumber: '+911234567890',
              role: 'PARENT',
              isActive: true,
              lastLoginAt: '2026-02-10T09:00:00.000Z',
              createdAt: '2026-01-15T10:00:00.000Z',
            },
          ],
          pagination: {
            total: 523,
            skip: 0,
            take: 20,
            pages: 27,
          },
        },
      },
    },
  })
  async getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('isActive') isActiveRaw?: string,
  ) {
    let isActive: boolean | undefined;
    if (typeof isActiveRaw === 'string') {
      const v = isActiveRaw.toLowerCase();
      if (v === 'true') isActive = true;
      if (v === 'false') isActive = false;
    }

    return this.adminService.getUsers(role as UserRole, search, skip || 0, take || 20, isActive);
  }

  /**
   * Get user details
   */
  @Get('users/:id')
  @ApiOperation({
    summary: '[Admin] Get user details',
    description:
      'Get detailed information about a user including their students and subscriptions.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
  })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetails(id);
  }

  /**
   * Toggle user active status
   */
  @Patch('users/:id/toggle-status')
  @ApiOperation({
    summary: '[Admin] Toggle user active status',
    description: 'Activate or deactivate a user account.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
  })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async toggleUserStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  /**
   * Get user's students (Admin)
   */
  @Get('users/:id/students')
  @ApiOperation({
    summary: '[Admin] Get user students',
    description: 'Get students belonging to a specific user (parent).',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async getUserStudents(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserStudents(id);
  }

  /**
   * Get user's subscriptions (Admin)
   */
  @Get('users/:id/subscriptions')
  @ApiOperation({
    summary: '[Admin] Get user subscriptions',
    description: 'Get subscriptions belonging to a specific user (parent).',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async getUserSubscriptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserSubscriptions(id);
  }

  /**
   * Get user's orders (Admin)
   */
  @Get('users/:id/orders')
  @ApiOperation({
    summary: '[Admin] Get user orders',
    description: 'Get orders belonging to a specific user (parent).',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async getUserOrders(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserOrders(id);
  }

  /**
   * Get sales report
   */
  @Get('reports/sales')
  @ApiOperation({
    summary: '[Admin] Get sales report',
    description: 'Get sales report with revenue breakdown by school for a date range.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO)',
    example: '2026-02-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO)',
    example: '2026-02-28',
  })
  @ApiQuery({ name: 'schoolId', required: false, description: 'Filter by school UUID' })
  @ApiResponse({
    status: 200,
    description: 'Sales report generated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          period: {
            start: '2026-02-01T00:00:00.000Z',
            end: '2026-02-28T23:59:59.999Z',
          },
          totalRevenue: 2450000,
          totalOrders: 245,
          averageOrderValue: 10000,
          bySchool: {
            'ABC School': { orders: 87, revenue: 870000 },
            'XYZ School': { orders: 158, revenue: 1580000 },
          },
          orders: [], // Top 50 orders
        },
      },
    },
  })
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId?: string,
  ) {
    return this.adminService.getSalesReport(startDate, endDate, schoolId);
  }

  @Get('reports/sales/export')
  async exportSalesReport(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportSalesReportCsv(startDate, endDate, schoolId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
    return res.status(200).send(csv);
  }

  /**
   * Get subscription report
   */
  @Get('reports/subscriptions')
  @ApiOperation({
    summary: '[Admin] Get subscription report',
    description: 'Get subscription statistics by status and trends.',
  })
  @ApiQuery({ name: 'schoolId', required: false, description: 'Filter by school UUID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription report generated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          byStatus: {
            PENDING_PAYMENT: 15,
            ACTIVE: 230,
            COMPLETED: 89,
            CANCELLED: 12,
          },
          recentSubscriptions: 45,
          totalActive: 230,
        },
      },
    },
  })
  async getSubscriptionReport(
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId?: string,
  ) {
    return this.adminService.getSubscriptionReport(schoolId);
  }
}
