import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, Roles, UserRole } from '../common/decorators';
import { UpdateBrandingSettingDto, UpdateTaxSettingDto } from './dto';
import { AppSettingsService } from './app-settings.service';

@ApiTags('App Settings')
@Controller({ path: 'app-settings', version: '1' })
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get('tax')
  @Public()
  @ApiOperation({
    summary: 'Get global tax setting',
    description: 'Public endpoint to read current global tax percentage for app calculations.',
  })
  @ApiResponse({ status: 200, description: 'Tax setting retrieved successfully' })
  async getTaxSetting() {
    return this.appSettingsService.getTaxSetting();
  }

  @Get('branding')
  @Public()
  @ApiOperation({
    summary: 'Get branding settings',
    description:
      'Public endpoint to read app branding data (logo URL) for admin and mobile applications.',
  })
  @ApiResponse({ status: 200, description: 'Branding setting retrieved successfully' })
  async getBrandingSetting() {
    return this.appSettingsService.getBrandingSetting();
  }

  @Patch('tax')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update global tax setting',
    description: 'Admin only: updates global tax percentage used across order calculations.',
  })
  @ApiResponse({ status: 200, description: 'Tax setting updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateTaxSetting(@Body() updateTaxSettingDto: UpdateTaxSettingDto) {
    return this.appSettingsService.updateTaxPercentage(updateTaxSettingDto.taxPercentage);
  }

  @Patch('branding')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update branding settings',
    description: 'Admin only: updates the application logo URL used across admin and mobile apps.',
  })
  @ApiResponse({ status: 200, description: 'Branding setting updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateBrandingSetting(@Body() updateBrandingSettingDto: UpdateBrandingSettingDto) {
    return this.appSettingsService.updateBrandingSetting(updateBrandingSettingDto.logoUrl);
  }
}
