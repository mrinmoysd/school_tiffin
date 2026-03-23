import { IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCmsPageDto {
  @ApiProperty({
    description: 'Page title',
    example: 'About Us',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Page content (HTML)',
    example: '<h1>About Us</h1><p>We provide healthy meals...</p>',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Meta description for SEO',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiProperty({
    description: 'Publish status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
