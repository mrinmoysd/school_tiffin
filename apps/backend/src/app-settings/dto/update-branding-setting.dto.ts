import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class UpdateBrandingSettingDto {
  @ApiPropertyOptional({
    description: 'Application logo URL. Send null to clear logo and fallback to default branding.',
    example: 'https://bucket.s3.ap-south-1.amazonaws.com/app-branding/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string | null;
}
