export type SubscriptionStatus =
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SubscriptionStudent {
  id: string;
  fullName: string;
  grade: number;
  school: {
    id: string;
    name: string;
  };
}

export interface SubscriptionMealPlan {
  id: string;
  name: string;
  pricePerDay: number;
  currency: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  studentId: string;
  mealPlanId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  remainingDays: number;
  totalPrice: number;
  currency: string;
  status: SubscriptionStatus;
  student: SubscriptionStudent;
  mealPlan: SubscriptionMealPlan;
  createdAt: string;
}
