import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscriptionStatus,
  OrderStatus,
  UserRole,
  DeliveryStatus,
  PauseRequestStatus,
} from '@prisma/client';
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

  async getRecentActivity() {
    const [recentSubscriptions, recentOrders] = await Promise.all([
      this.prisma.subscription.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { id: true, fullName: true, email: true } },
          student: { select: { id: true, fullName: true } },
          school: { select: { id: true, name: true } },
          mealPlan: { select: { id: true, name: true } },
        },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { id: true, fullName: true, email: true } },
          subscription: {
            select: { id: true, subscriptionNumber: true },
          },
        },
      }),
    ]);

    return {
      recentSubscriptions,
      recentOrders,
    };
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

  async markDeliveriesDelivered(deliveryIds: string[]) {
    const updates = await Promise.all(
      deliveryIds.map(deliveryId =>
        this.updateDeliveryStatus(deliveryId, DeliveryStatus.DELIVERED),
      ),
    );
    return {
      updatedCount: updates.length,
    };
  }

  async exportDeliveriesCsv(schoolId?: string, date?: string) {
    const report = await this.getDeliveries(schoolId, date);
    const rows: string[] = [
      'deliveryId,date,school,studentName,grade,mealPlan,subscriptionNumber,status,parentPhone',
    ];

    type CsvDelivery = {
      id: string;
      scheduledDate: Date | string;
      status: string;
      subscription?: {
        subscriptionNumber?: string;
        student?: { fullName?: string; grade?: string };
        mealPlan?: { name?: string };
        parent?: { phoneNumber?: string };
      };
    };

    for (const [schoolName, deliveries] of Object.entries(report.bySchool || {})) {
      for (const delivery of deliveries as CsvDelivery[]) {
        rows.push(
          [
            delivery.id,
            delivery.scheduledDate,
            schoolName,
            delivery.subscription?.student?.fullName || '',
            delivery.subscription?.student?.grade || '',
            delivery.subscription?.mealPlan?.name || '',
            delivery.subscription?.subscriptionNumber || '',
            delivery.status,
            delivery.subscription?.parent?.phoneNumber || '',
          ]
            .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(','),
        );
      }
    }

    return rows.join('\n');
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

  async getOrders(status?: OrderStatus, search?: string, startDate?: string, endDate?: string) {
    return this.prisma.order.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { parent: { fullName: { contains: search, mode: 'insensitive' } } },
            { subscription: { subscriptionNumber: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startOfDay(new Date(startDate)) }),
            ...(endDate && { lte: endOfDay(new Date(endDate)) }),
          },
        }),
      },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async exportOrdersCsv(
    status?: OrderStatus,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const orders = await this.getOrders(status, search, startDate, endDate);
    const rows: string[] = [
      'orderId,orderNumber,parentName,parentEmail,subscriptionNumber,status,amount,finalAmount,currency,createdAt,paidAt',
    ];

    type CsvOrder = {
      id: string;
      orderNumber: string;
      status: string;
      amount: number;
      finalAmount: number;
      currency: string;
      createdAt: Date | string;
      paidAt?: Date | string | null;
      parent?: { fullName?: string; email?: string };
      subscription?: { subscriptionNumber?: string };
    };

    for (const order of orders as CsvOrder[]) {
      rows.push(
        [
          order.id,
          order.orderNumber,
          order.parent?.fullName || '',
          order.parent?.email || '',
          order.subscription?.subscriptionNumber || '',
          order.status,
          order.amount,
          order.finalAmount,
          order.currency,
          order.createdAt,
          order.paidAt || '',
        ]
          .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      );
    }

    return rows.join('\n');
  }

  async getSubscriptions(
    status?: SubscriptionStatus,
    schoolId?: string,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.prisma.subscription.findMany({
      where: {
        ...(status && { status }),
        ...(schoolId && { schoolId }),
        ...(search && {
          OR: [
            { subscriptionNumber: { contains: search, mode: 'insensitive' } },
            { parent: { fullName: { contains: search, mode: 'insensitive' } } },
            { student: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startOfDay(new Date(startDate)) }),
            ...(endDate && { lte: endOfDay(new Date(endDate)) }),
          },
        }),
      },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
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
        pauseRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async getSubscriptionSchedule(id: string) {
    await this.getSubscriptionById(id);
    return this.prisma.subscriptionDay.findMany({
      where: { subscriptionId: id },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async cancelSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    if (subscription.status === SubscriptionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed subscription');
    }

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

  async getPauseRequests(
    status?: PauseRequestStatus,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.prisma.pauseRequest.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { parent: { fullName: { contains: search, mode: 'insensitive' } } },
            { subscription: { subscriptionNumber: { contains: search, mode: 'insensitive' } } },
            { subscription: { student: { fullName: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startOfDay(new Date(startDate)) }),
            ...(endDate && { lte: endOfDay(new Date(endDate)) }),
          },
        }),
      },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            student: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPauseRequestById(id: string) {
    const pauseRequest = await this.prisma.pauseRequest.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            student: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!pauseRequest) {
      throw new NotFoundException('Pause request not found');
    }

    return pauseRequest;
  }

  async updatePauseRequestStatus(id: string, status: PauseRequestStatus, reason?: string) {
    void reason;
    const pauseRequest = await this.prisma.pauseRequest.findUnique({
      where: { id },
    });

    if (!pauseRequest) {
      throw new NotFoundException('Pause request not found');
    }

    if (pauseRequest.status !== PauseRequestStatus.PENDING) {
      throw new BadRequestException('Can only approve/reject pending requests');
    }

    return this.prisma.pauseRequest.update({
      where: { id },
      data: {
        status,
        processedAt: status === PauseRequestStatus.REJECTED ? new Date() : undefined,
      },
    });
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

  async exportSalesReportCsv(startDate?: string, endDate?: string, schoolId?: string) {
    const report = await this.getSalesReport(startDate, endDate, schoolId);
    const rows: string[] = ['orderId,orderNumber,studentName,school,amount,paidAt'];

    type SalesOrder = {
      id: string;
      orderNumber: string;
      amount: number;
      paidAt?: Date | string | null;
      subscription?: {
        student?: {
          fullName?: string;
          school?: { name?: string };
        };
      };
    };

    for (const order of report.orders as SalesOrder[]) {
      rows.push(
        [
          order.id,
          order.orderNumber,
          order.subscription?.student?.fullName || '',
          order.subscription?.student?.school?.name || '',
          order.amount,
          order.paidAt || '',
        ]
          .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      );
    }

    return rows.join('\n');
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
