import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  APP_LOGO_URL_SETTING_KEY,
  DEFAULT_TAX_PERCENTAGE,
  TAX_PERCENTAGE_SETTING_KEY,
} from './app-settings.constants';
import { normalizeImageReferencePath } from '../uploads/upload-storage.util';

@Injectable()
export class AppSettingsService {
  constructor(private prisma: PrismaService) {}

  private sanitizeTaxPercentage(rawValue: string | number | null | undefined): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_TAX_PERCENTAGE;
    }

    if (parsed < 0) return 0;
    if (parsed > 100) return 100;

    return Number(parsed.toFixed(2));
  }

  private sanitizeLogoUrl(rawValue: string | null | undefined): string | null {
    return normalizeImageReferencePath(rawValue);
  }

  async getTaxSetting() {
    const setting = await this.prisma.appSetting.upsert({
      where: { key: TAX_PERCENTAGE_SETTING_KEY },
      update: {},
      create: {
        key: TAX_PERCENTAGE_SETTING_KEY,
        value: String(DEFAULT_TAX_PERCENTAGE),
        description: 'Global tax percentage applied to all orders',
      },
    });

    return {
      key: setting.key,
      taxPercentage: this.sanitizeTaxPercentage(setting.value),
      updatedAt: setting.updatedAt,
      description: setting.description,
    };
  }

  async getTaxPercentage(): Promise<number> {
    const taxSetting = await this.getTaxSetting();
    return taxSetting.taxPercentage;
  }

  async updateTaxPercentage(taxPercentage: number) {
    const sanitized = this.sanitizeTaxPercentage(taxPercentage);

    const setting = await this.prisma.appSetting.upsert({
      where: { key: TAX_PERCENTAGE_SETTING_KEY },
      update: {
        value: String(sanitized),
        description: 'Global tax percentage applied to all orders',
      },
      create: {
        key: TAX_PERCENTAGE_SETTING_KEY,
        value: String(sanitized),
        description: 'Global tax percentage applied to all orders',
      },
    });

    return {
      key: setting.key,
      taxPercentage: this.sanitizeTaxPercentage(setting.value),
      updatedAt: setting.updatedAt,
      description: setting.description,
    };
  }

  async getBrandingSetting() {
    const setting = await this.prisma.appSetting.upsert({
      where: { key: APP_LOGO_URL_SETTING_KEY },
      update: {},
      create: {
        key: APP_LOGO_URL_SETTING_KEY,
        value: '',
        description: 'Global application logo URL used across admin and mobile clients',
      },
    });

    return {
      key: setting.key,
      logoUrl: this.sanitizeLogoUrl(setting.value),
      updatedAt: setting.updatedAt,
      description: setting.description,
    };
  }

  async updateBrandingSetting(logoUrl?: string | null) {
    const sanitizedLogoUrl = this.sanitizeLogoUrl(logoUrl);

    const setting = await this.prisma.appSetting.upsert({
      where: { key: APP_LOGO_URL_SETTING_KEY },
      update: {
        value: sanitizedLogoUrl ?? '',
        description: 'Global application logo URL used across admin and mobile clients',
      },
      create: {
        key: APP_LOGO_URL_SETTING_KEY,
        value: sanitizedLogoUrl ?? '',
        description: 'Global application logo URL used across admin and mobile clients',
      },
    });

    return {
      key: setting.key,
      logoUrl: this.sanitizeLogoUrl(setting.value),
      updatedAt: setting.updatedAt,
      description: setting.description,
    };
  }
}
