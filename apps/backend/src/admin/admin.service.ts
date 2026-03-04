import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, OrderStatus, UserRole, DeliveryStatus } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboard() {
    const cacheKey = 'admin:dashboard';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);

    // Parallel queries for better performance
    const [
      activeSubscriptions,
      todayDeliveries,
      monthlyRevenue,
      pendingPauseRequests,
      activeSchools,
      totalUsers,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscriptionDay.count({
        where: {
          scheduledDate: {
            gte: today,
            lte: endOfDay(now),
          },
          status: 'SCHEDULED',
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.PAID,
          paidAt: {
            gte: monthStart,
            lte: endOfMonth(now),
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.pauseRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.school.count({
        where: { deletedAt: null },
      }),
      this.prisma.user.count({
        where: { role: 'PARENT' },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
    ]);

    const stats = {
      activeSubscriptions,
      todayDeliveries,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      pendingPauseRequests,
      activeSchools,
      totalUsers,
      pendingOrders,
      lastUpdated: new Date(),
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  /**
   * Get deliveries by date and school
   */
  async getDeliveries(schoolId?: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());

    const deliveries = await this.prisma.subscriptionDay.findMany({
      where: {
        scheduledDate: {
          gte: targetDate,
          lte: endOfDay(targetDate),
        },
        ...(schoolId && {
          subscription: {
            student: {
              schoolId,
            },
          },
        }),
      },
      include: {
        subscription: {
          select: {
            subscriptionNumber: true,
            student: {
              select: {
                fullName: true,
                grade: true,
                section: true,
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
            parent: {
              select: {
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: [
        { subscription: { student: { school: { name: 'asc' } } } },
        { subscription: { student: { grade: 'asc' } } },
        { subscription: { student: { fullName: 'asc' } } },
      ],
    });

    // Group by school
    const grouped = deliveries.reduce((acc, delivery) => {
      const schoolName = delivery.subscription.student.school.name;
      if (!acc[schoolName]) {
        acc[schoolName] = [];
      }
      acc[schoolName].push(delivery);
      return acc;
    }, {});

    return {
      date: targetDate,
      totalDeliveries: deliveries.length,
      bySchool: grouped,
    };
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
    const updated = await this.prisma.subscriptionDay.update({
      where: { id: deliveryId },
      data: {
        status,
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    });

    // Update subscription remaining days if delivered
    if (status === 'DELIVERED') {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: updated.subscriptionId },
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            remainingDays: Math.max(0, subscription.remainingDays - 1),
          },
        });
      }
    }

    return updated;
  }

  /**
   * Get all users with filters
   */
  async getUsers(role?: UserRole, search?: string, skip = 0, take = 20, isActive?: boolean) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const total = await this.prisma.user.count({
      where: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    });

    return {
      users,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get user's students (Admin)
   */
  async getUserStudents(userId: string) {
    return this.prisma.student.findMany({
      where: {
        parentId: userId,
        deletedAt: null,
      },
      include: {
        school: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's subscriptions (Admin)
   */
  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: {
        parentId: userId,
      },
      include: {
        student: { select: { fullName: true } },
        mealPlan: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's orders (Admin)
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        parentId: userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user details including subscriptions
   */
  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Last 5 subscriptions
            },
          },
        },
      },
    });

    return user;
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
      },
    });

    return updated;
  }

  /**
   * Get sales report
   */
  async getSalesReport(startDate?: string, endDate?: string, schoolId?: string) {
    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        paidAt: {
          gte: start,
          lte: end,
        },
        ...(schoolId && {
          subscription: {
            student: {
              schoolId,
            },
          },
        }),
      },
      include: {
        subscription: {
          select: {
            subscriptionNumber: true,
            totalDays: true,
            student: {
              select: {
                fullName: true,
                school: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    const totalOrders = orders.length;

    // Group by school
    const bySchool = orders.reduce((acc, order) => {
      const schoolName = order.subscription.student.school.name;
      if (!acc[schoolName]) {
        acc[schoolName] = { orders: 0, revenue: 0 };
      }
      acc[schoolName].orders += 1;
      acc[schoolName].revenue += Number(order.amount);
      return acc;
    }, {});

    return {
      period: { start, end },
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      bySchool,
      orders: orders.slice(0, 50), // Return top 50 orders
    };
  }

  /**
   * Get subscription report
   */
  async getSubscriptionReport(schoolId?: string) {
    const subscriptions = await this.prisma.subscription.groupBy({
      by: ['status'],
      ...(schoolId && {
        where: {
          student: {
            schoolId,
          },
        },
      }),
      _count: {
        _all: true,
      },
    });

    const byStatus = subscriptions.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    // Get trend data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscriptions = await this.prisma.subscription.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        ...(schoolId && {
          student: {
            schoolId,
          },
        }),
      },
    });

    return {
      byStatus,
      recentSubscriptions,
      totalActive: byStatus['ACTIVE'] || 0,
    };
  }
}
