export interface School {
  id: string;
  name: string;
  address: string;
  city: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  operatingDays: string[] | string;
  isServiceAvailable: boolean;
  imageUrl?: string | null;
  createdAt: string;
}

export interface SchoolMealPlan {
  id: string;
  name: string;
  description: string | null;
  pricePerDay: number;
  currency: string;
  isActive: boolean;
}

export interface SchoolDetails extends School {
  mealPlans: SchoolMealPlan[];
}
