import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Razorpay Order ID',
    example: 'order_M1A2B3C4D5E6F7',
  })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({
    description: 'Razorpay Payment ID',
    example: 'pay_M1A2B3C4D5E6F7',
  })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({
    description: 'Razorpay Signature',
    example: 'abc123def456...',
  })
  @IsString()
  razorpaySignature: string;
}
