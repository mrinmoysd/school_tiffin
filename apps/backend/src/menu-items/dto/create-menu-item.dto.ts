import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Menu item name',
    example: 'Dal Rice with Vegetables',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Menu items description (comma-separated)',
    example: 'Dal, Rice, Mixed Vegetables, Roti',
  })
  @IsString()
  items: string;

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
    description: 'Meal plan ID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  mealPlanId: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/dal-rice.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Allergen information',
    example: 'Contains gluten',
    required: false,
  })
  @IsOptional()
  @IsString()
  allergenInfo?: string;
}
