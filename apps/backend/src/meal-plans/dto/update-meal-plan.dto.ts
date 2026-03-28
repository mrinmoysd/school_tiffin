import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMealPlanDto {
  @ApiProperty({
    description: 'Meal plan name',
    example: 'Standard Meal Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

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
  imageUrl?: string | null;

  @ApiProperty({
    description: 'Meal plan type ID from meal_plan_types master table',
    example: '7a8f2f11-9e11-4a6b-bf0f-a7a93f75a002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  mealPlanTypeId?: string;

  @ApiProperty({
    description:
      'Legacy meal plan type code (e.g., BREAKFAST). If mealPlanTypeId is missing this is used.',
    example: 'LUNCH',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_\-\s]+$/)
  planType?: string;

  @ApiProperty({
    description: 'Duration in days',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({
    description: 'Price per day in smallest currency unit (paise for INR)',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerDay?: number;

  @ApiProperty({
    description: 'Total price for the entire plan',
    example: 300000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'School ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiProperty({
    description: 'Is meal plan active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
