import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMenuItemDto {
  @ApiProperty({
    description: 'Menu item name',
    example: 'Dal Rice with Vegetables',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Menu items description (comma-separated)',
    example: 'Dal, Rice, Mixed Vegetables, Roti',
    required: false,
  })
  @IsOptional()
  @IsString()
  items?: string;

  @ApiProperty({
    description: 'Menu item description',
    example: 'Protein-rich lentils with steamed rice and seasonal vegetables',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Day of week (optional)',
    example: 'Monday',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dayOfWeek?: string;

  @ApiProperty({
    description: 'Day number in plan (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  dayNumber?: number;

  @ApiProperty({
    description: 'Calories (kcal)',
    example: 450,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @ApiProperty({
    description: 'Allergen information',
    example: 'Contains gluten',
    required: false,
  })
  @IsOptional()
  @IsString()
  allergenInfo?: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/dal-rice.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
