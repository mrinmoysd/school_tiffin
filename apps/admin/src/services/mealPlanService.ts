import api from '@/lib/axios';
import {
  ApiResponse,
  MealPlan,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  MealPlanFilters,
  MenuItem,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from '@/types';

const toQueryString = (
  params: Record<string, string | number | boolean | null | undefined>,
): string => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).length > 0)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

export const mealPlanService = {
  // Get all meal plans
  getAll: async (filters?: MealPlanFilters): Promise<MealPlan[]> => {
    const query = toQueryString({
      schoolId: filters?.schoolId,
      mealPlanTypeId: filters?.mealPlanTypeId,
      planType: filters?.planType,
      search: filters?.search,
      isActive: filters?.isActive,
    });

    const response = await api.get<ApiResponse<MealPlan[]>>(
      query ? `/meal-plans?${query}` : '/meal-plans',
    );
    return response.data.data;
  },

  // Get meal plan by ID
  getById: async (id: string): Promise<MealPlan> => {
    const response = await api.get<ApiResponse<MealPlan>>(`/meal-plans/${id}`);
    return response.data.data;
  },

  // Create meal plan
  create: async (data: CreateMealPlanDto): Promise<MealPlan> => {
    const response = await api.post<ApiResponse<MealPlan>>('/meal-plans', data);
    return response.data.data;
  },

  // Update meal plan
  update: async (id: string, data: UpdateMealPlanDto): Promise<MealPlan> => {
    const response = await api.patch<ApiResponse<MealPlan>>(`/meal-plans/${id}`, data);
    return response.data.data;
  },

  // Delete meal plan (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/meal-plans/${id}`);
  },

  // Toggle active status
  toggleActive: async (id: string, isActive: boolean): Promise<MealPlan> => {
    const response = await api.patch<ApiResponse<MealPlan>>(`/meal-plans/${id}`, { isActive });
    return response.data.data;
  },
};

export const menuItemService = {
  // Get menu items by meal plan
  getByMealPlan: async (mealPlanId: string): Promise<MenuItem[]> => {
    const response = await api.get<ApiResponse<MenuItem[]>>(`/menu-items?mealPlanId=${mealPlanId}`);
    return response.data.data;
  },

  // Get menu item by ID
  getById: async (id: string): Promise<MenuItem> => {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu-items/${id}`);
    return response.data.data;
  },

  // Create menu item
  create: async (data: CreateMenuItemDto): Promise<MenuItem> => {
    const response = await api.post<ApiResponse<MenuItem>>('/menu-items', data);
    return response.data.data;
  },

  // Update menu item
  update: async (id: string, data: UpdateMenuItemDto): Promise<MenuItem> => {
    const response = await api.patch<ApiResponse<MenuItem>>(`/menu-items/${id}`, data);
    return response.data.data;
  },

  // Delete menu item
  delete: async (id: string): Promise<void> => {
    await api.delete(`/menu-items/${id}`);
  },
};
