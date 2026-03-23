import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateMealPlanTypeDto {
  @ApiProperty({
    description: 'Unique meal plan type code',
    example: 'BREAKFAST',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_\-\s]+$/, {
    message: 'Code can contain letters, numbers, spaces, hyphen, and underscore only',
  })
  code?: string;

  @ApiProperty({
    description: 'Display name shown in the UI dropdowns',
    example: 'Breakfast',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({
    description: 'Optional description for admin reference',
    example: 'Morning meal plans',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Sort order in dropdown and listing',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    description: 'Is this type active for selection',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
