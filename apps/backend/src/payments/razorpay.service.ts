import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(amount: number, currency: string, orderId: string) {
    const options = {
      amount, // amount in smallest currency unit (paise)
      currency,
      receipt: orderId,
      notes: {
        orderId,
      },
    };

    return await this.razorpay.orders.create(options);
  }

  /**
   * Verify payment signature
   */
  verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    const webhookSecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    const body = razorpayOrderId + '|' + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Fetch payment details
   */
  async fetchPayment(paymentId: string) {
    return await this.razorpay.payments.fetch(paymentId);
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount?: number) {
    return await this.razorpay.payments.refund(paymentId, { amount });
  }
}
