export interface MealPlanSummary {
  id: string;
  name: string;
  description: string | null;
  planType: string;
  durationDays: number;
  pricePerDay: number | string;
  totalPrice: number | string;
  currency: string;
  isActive: boolean;
  imageUrl: string | null;
}

export interface MealPlanMenuItem {
  id: string;
  name: string;
  dayOfWeek: string | null;
  dayNumber: number | null;
  items: string;
  description?: string | null;
  calories?: number | null;
  allergenInfo?: string | null;
  imageUrl?: string | null;
}

export interface MealPlanDetails extends MealPlanSummary {
  school?: {
    id: string;
    name: string;
    city?: string | null;
  };
  menuItems: MealPlanMenuItem[];
}
