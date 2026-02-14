import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, SubscriptionStatus, TransactionStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentIntentDto, VerifyPaymentDto } from './dto';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private razorpayService: RazorpayService,
    private configService: ConfigService,
  ) {}

  /**
   * Create payment intent (Razorpay order)
   */
  async createIntent(parentId: string, createPaymentIntentDto: CreatePaymentIntentDto) {
    const { subscriptionId } = createPaymentIntentDto;

    // Verify subscription belongs to parent
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        student: {
          parentId,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Subscription is not pending payment');
    }

    // Create or get existing order
    let order = await this.prisma.order.findFirst({
      where: {
        subscriptionId,
        status: OrderStatus.PENDING,
      },
    });

    if (!order) {
      // Create new order
      order = await this.ordersService.create(parentId, {
        subscriptionId,
        amount: Number(subscription.totalPrice),
        currency: subscription.currency,
      });
    }

    // Create Razorpay order
    const razorpayOrder = await this.razorpayService.createOrder(
      Number(order.amount),
      order.currency,
      order.orderNumber,
    );

    // Update order with Razorpay order ID
    await this.ordersService.updateStatus(order.id, OrderStatus.PENDING, razorpayOrder.id);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  /**
   * Verify payment
   */
  async verifyPayment(parentId: string, verifyPaymentDto: VerifyPaymentDto) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentDto;

    // Verify signature
    const isValid = this.razorpayService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find order by Razorpay order ID
    const order = await this.prisma.order.findFirst({
      where: {
        paymentGatewayOrderId: razorpayOrderId,
      },
      include: {
        subscription: {
          include: {
            student: {
              select: {
                parentId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    if (order.subscription.student.parentId !== parentId) {
      throw new BadRequestException('Order does not belong to you');
    }

    // Check idempotency - already processed?
    if (order.status === OrderStatus.PAID) {
      return {
        message: 'Payment already processed',
        order,
      };
    }

    // Process payment with transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      // Create transaction record
      await tx.paymentTransaction.create({
        data: {
          order: { connect: { id: order.id } },
          transactionId: `txn_${Date.now()}_${order.id.substring(0, 8)}`,
          paymentGateway: 'razorpay',
          gatewayTransactionId: razorpayPaymentId,
          amount: order.amount,
          currency: order.currency,
          status: TransactionStatus.SUCCESS,
          gatewayResponse: {
            razorpayOrderId,
            razorpayPaymentId,
          },
        },
      });

      // Activate subscription
      await tx.subscription.update({
        where: { id: order.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      return updatedOrder;
    });

    // TODO: Queue notification to parent
    // await this.notificationQueue.add('payment-success', { orderId: order.id });

    return {
      message: 'Payment verified successfully',
      order: result,
    };
  }

  /**
   * Handle webhook (background job will process)
   */
  async handleWebhook(payload: any, signature: string) {
    // Verify webhook signature
    const isValid = this.razorpayService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Queue webhook processing (implement with BullMQ)
    // TODO: await this.webhookQueue.add('process-webhook', payload);

    return { received: true };
  }
}
