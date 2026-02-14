import { Controller, Get, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles, UserRole } from '../common/decorators';

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
    description: 'Get comprehensive dashboard statistics including active subscriptions, deliveries, revenue, and more. Cached for 5 minutes.',
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

  /**
   * Get deliveries by date and school
   */
  @Get('deliveries')
  @ApiOperation({
    summary: '[Admin] Get deliveries',
    description: 'Get deliveries filtered by date and/or school. Returns deliveries grouped by school.',
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

  /**
   * Update delivery status
   */
  @Patch('deliveries/:id/status')
  @ApiOperation({
    summary: '[Admin] Update delivery status',
    description: 'Mark delivery as delivered or cancelled. Updates subscription remaining days if delivered.',
  })
  @ApiParam({
    name: 'id',
    description: 'Delivery (SubscriptionDay) UUID',
  })
  @ApiQuery({
    name: 'status',
    enum: ['DELIVERED', 'CANCELLED', 'SCHEDULED'],
    description: 'New delivery status',
  })
  @ApiResponse({ status: 200, description: 'Delivery status updated successfully' })
  async updateDeliveryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: string,
  ) {
    return this.adminService.updateDeliveryStatus(id, status as any);
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
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Pagination skip', example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Pagination take', example: 20 })
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
  ) {
    return this.adminService.getUsers(role as UserRole, search, skip || 0, take || 20);
  }

  /**
   * Get user details
   */
  @Get('users/:id')
  @ApiOperation({
    summary: '[Admin] Get user details',
    description: 'Get detailed information about a user including their students and subscriptions.',
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
   * Get sales report
   */
  @Get('reports/sales')
  @ApiOperation({
    summary: '[Admin] Get sales report',
    description: 'Get sales report with revenue breakdown by school for a date range.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO)', example: '2026-02-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO)', example: '2026-02-28' })
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
