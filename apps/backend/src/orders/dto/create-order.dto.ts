import { IsUUID, IsInt, IsPositive, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    description: 'Amount in smallest currency unit (e.g., paise for INR)',
    example: 300000,
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Order notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
