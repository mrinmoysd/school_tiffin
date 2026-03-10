export interface School {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state?: string | null;
  pincode?: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  operatingDays: string[] | string;
  deliveryInstructions?: string | null;
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
