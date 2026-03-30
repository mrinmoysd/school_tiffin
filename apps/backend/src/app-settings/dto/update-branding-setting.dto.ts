import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBrandingSettingDto {
  @ApiPropertyOptional({
    description: 'Application logo image URL. Send null to clear logo.',
    example: 'https://res.cloudinary.com/demo/image/upload/v1736793442/app-branding/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;
}
