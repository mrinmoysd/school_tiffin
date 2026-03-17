import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum MealPlanType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  SNACK = 'SNACK',
  COMBO = 'COMBO',
}

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'Meal plan name',
    example: 'Standard Meal Plan',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Meal plan description',
    example: 'Healthy and nutritious meals for students',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Meal plan image URL',
    example: 'https://example.com/meal-plan.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Meal plan type',
    enum: MealPlanType,
    example: MealPlanType.LUNCH,
  })
  @IsEnum(MealPlanType)
  planType: MealPlanType;

  @ApiProperty({
    description: 'Duration in days',
    example: 30,
  })
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiProperty({
    description: 'Price per day in smallest currency unit (paise for INR)',
    example: 10000,
  })
  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @ApiProperty({
    description: 'Total price for the entire plan',
    example: 300000,
  })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
    default: 'INR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'School ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  schoolId: string;

  @ApiProperty({
    description: 'Is meal plan active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
