import { IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCmsPageDto {
  @ApiProperty({
    description: 'Page slug (URL-friendly)',
    example: 'about-us',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug: string;

  @ApiProperty({
    description: 'Page title',
    example: 'About Us',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Page content (HTML)',
    example: '<h1>About Us</h1><p>We provide healthy meals...</p>',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Meta description for SEO',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiProperty({
    description: 'Publish immediately',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
