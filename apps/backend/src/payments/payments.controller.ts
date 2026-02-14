import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, VerifyPaymentDto } from './dto';
import { CurrentUser, Public } from '../common/decorators';
import { Request } from 'express';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create payment intent
   */
  @Post('create-intent')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment intent',
    description: 'Create a Razorpay order for subscription payment. Returns order details and Razorpay key.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          orderId: 'bb0e8400-e29b-41d4-a716-446655440000',
          orderNumber: 'ORD-1707484800000-5678',
          amount: 300000,
          currency: 'INR',
          razorpayOrderId: 'order_M1A2B3C4D5E6F7',
          razorpayKeyId: 'rzp_test_xxxxxxx',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Subscription not pending payment' })
  async createIntent(
    @CurrentUser('sub') parentId: string,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createIntent(parentId, createPaymentIntentDto);
  }

  /**
   * Verify payment
   */
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify Razorpay payment signature and activate subscription. Idempotent operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified successfully, subscription activated',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  async verifyPayment(
    @CurrentUser('sub') parentId: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(parentId, verifyPaymentDto);
  }

  /**
   * Webhook endpoint for Razorpay
   */
  @Post('webhook')
  @Public()
  @ApiOperation({
    summary: 'Razorpay webhook',
    description: 'Webhook endpoint for Razorpay payment events. Verifies signature and queues processing.',
  })
  @ApiHeader({
    name: 'x-razorpay-signature',
    description: 'Razorpay webhook signature',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async webhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
