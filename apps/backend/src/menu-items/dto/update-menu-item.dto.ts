import { IsString, IsOptional, MinLength, MaxLength, IsJSON, IsUrl } from 'class-validator';
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
    description: 'Menu item description',
    example: 'Protein-rich lentils with steamed rice and seasonal vegetables',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Category (breakfast, lunch, snack, etc.)',
    example: 'lunch',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/dal-rice.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Allergens (JSON array)',
    example: ['gluten', 'dairy'],
    required: false,
  })
  @IsOptional()
  @IsJSON()
  allergens?: string;
}
