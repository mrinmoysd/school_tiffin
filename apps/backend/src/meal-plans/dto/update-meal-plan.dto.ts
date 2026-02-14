import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
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
    description: 'Price per day in smallest currency unit (paise for INR)',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerDay?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Is meal plan active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
