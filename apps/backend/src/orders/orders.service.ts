import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private appSettingsService: AppSettingsService,
  ) {}

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Create an order
   */
  async create(parentId: string, createOrderDto: CreateOrderDto) {
    const { subscriptionId, amount, currency, notes } = createOrderDto;

    // Verify subscription belongs to parent
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        student: {
          parentId,
        },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            parentId: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check subscription status
    if (subscription.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Subscription is not pending payment');
    }

    const subtotalAmount = Number(subscription.totalPrice);

    // Verify amount matches subscription subtotal
    if (amount !== subtotalAmount) {
      throw new BadRequestException('Amount does not match subscription total price');
    }

    const taxPercentage = await this.appSettingsService.getTaxPercentage();
    const taxAmount = Math.round((subtotalAmount * taxPercentage) / 100);
    const finalAmount = subtotalAmount + taxAmount;

    const orderNumber = this.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        subscription: { connect: { id: subscriptionId } },
        parent: { connect: { id: parentId } },
        amount: subtotalAmount,
        taxAmount,
        finalAmount,
        currency,
        notes,
        status: OrderStatus.PENDING,
      },
      include: {
        subscription: {
          select: {
            subscriptionNumber: true,
            totalDays: true,
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

    return order;
  }

  /**
   * Get order by ID
   */
  async findOne(id: string, parentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            totalDays: true,
            totalPrice: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                parentId: true,
              },
            },
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

    // Verify ownership
    if (order.subscription.student.parentId !== parentId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  /**
   * Get all orders for a parent
   */
  async findAllByParent(parentId: string, status?: OrderStatus) {
    // Get all subscriptions for this parent
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        student: {
          parentId,
        },
      },
      select: { id: true },
    });

    const subscriptionIds = subscriptions.map(s => s.id);

    const orders = await this.prisma.order.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
        ...(status && { status }),
      },
      include: {
        subscription: {
          select: {
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

    return orders;
  }

  /**
   * Update order status (internal use)
   */
  async updateStatus(id: string, status: OrderStatus, paymentGatewayOrderId?: string) {
    return await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(paymentGatewayOrderId && { paymentGatewayOrderId }),
        paidAt: status === OrderStatus.PAID ? new Date() : undefined,
        cancelledAt: status === OrderStatus.CANCELLED ? new Date() : undefined,
      },
    });
  }
}
