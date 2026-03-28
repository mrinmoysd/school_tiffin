import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBrandingSettingDto {
  @ApiPropertyOptional({
    description: 'Application logo path reference. Send null to clear logo.',
    example: '/uploads/app-branding/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;
}
