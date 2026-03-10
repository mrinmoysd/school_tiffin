import { apiRequest } from '../client/apiClient';
import { MealPlanDetails, MealPlanSummary } from './mealPlansApi.types';

export const mealPlansApi = {
  getMealPlansBySchool: async (schoolId: string): Promise<MealPlanSummary[]> =>
    apiRequest<MealPlanSummary[]>(`/meal-plans?schoolId=${encodeURIComponent(schoolId)}`, {
      method: 'GET',
    }),

  getMealPlanById: async (mealPlanId: string): Promise<MealPlanDetails> =>
    apiRequest<MealPlanDetails>(`/meal-plans/${mealPlanId}`, {
      method: 'GET',
    }),
};
