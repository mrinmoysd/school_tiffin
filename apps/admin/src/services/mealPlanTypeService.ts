import api from '@/lib/axios';
import {
  ApiResponse,
  CreateMealPlanTypeDto,
  MealPlanTypeMaster,
  UpdateMealPlanTypeDto,
} from '@/types';

const toQueryString = (
  params: Record<string, string | number | boolean | null | undefined>,
): string => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).length > 0)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

export const mealPlanTypeService = {
  getAll: async (isActive?: boolean): Promise<MealPlanTypeMaster[]> => {
    const query = toQueryString({
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });
    const response = await api.get<ApiResponse<MealPlanTypeMaster[]>>(
      query ? `/meal-plan-types?${query}` : '/meal-plan-types',
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<MealPlanTypeMaster> => {
    const response = await api.get<ApiResponse<MealPlanTypeMaster>>(`/meal-plan-types/${id}`);
    return response.data.data;
  },

  create: async (data: CreateMealPlanTypeDto): Promise<MealPlanTypeMaster> => {
    const response = await api.post<ApiResponse<MealPlanTypeMaster>>('/meal-plan-types', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateMealPlanTypeDto): Promise<MealPlanTypeMaster> => {
    const response = await api.patch<ApiResponse<MealPlanTypeMaster>>(
      `/meal-plan-types/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/meal-plan-types/${id}`);
  },

  toggleActive: async (id: string, isActive: boolean): Promise<MealPlanTypeMaster> => {
    const response = await api.patch<ApiResponse<MealPlanTypeMaster>>(`/meal-plan-types/${id}`, {
      isActive,
    });
    return response.data.data;
  },
};
