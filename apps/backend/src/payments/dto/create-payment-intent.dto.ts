import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Subscription ID to create payment for',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  subscriptionId: string;
}
