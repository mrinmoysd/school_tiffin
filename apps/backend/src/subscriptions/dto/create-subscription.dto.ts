import { IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Student ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Meal Plan ID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  mealPlanId: string;

  @ApiProperty({
    description: 'Subscription start date (ISO 8601)',
    example: '2026-02-10',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Number of days for subscription',
    example: 30,
    minimum: 1,
    maximum: 365,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  numberOfDays: number;
}
