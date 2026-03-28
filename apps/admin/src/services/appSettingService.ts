import api from '@/lib/axios';
import { ApiResponse, BrandingSetting, TaxSetting } from '@/types';

export const appSettingService = {
  getTaxSetting: async (): Promise<TaxSetting> => {
    const response = await api.get<ApiResponse<TaxSetting>>('/app-settings/tax');
    return response.data.data;
  },

  updateTaxSetting: async (taxPercentage: number): Promise<TaxSetting> => {
    const response = await api.patch<ApiResponse<TaxSetting>>('/app-settings/tax', {
      taxPercentage,
    });
    return response.data.data;
  },

  getBrandingSetting: async (): Promise<BrandingSetting> => {
    const response = await api.get<ApiResponse<BrandingSetting>>('/app-settings/branding');
    return response.data.data;
  },

  updateBrandingSetting: async (logoUrl: string | null): Promise<BrandingSetting> => {
    const response = await api.patch<ApiResponse<BrandingSetting>>('/app-settings/branding', {
      logoUrl,
    });
    return response.data.data;
  },
};
