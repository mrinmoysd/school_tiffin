export type SubscriptionStatus =
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SubscriptionStudent {
  id: string;
  fullName: string;
  grade: number | string | null;
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

export interface CreateSubscriptionPayload {
  studentId: string;
  mealPlanId: string;
  startDate: string;
  numberOfDays: number;
}

export interface SubscriptionScheduleDay {
  id: string;
  subscriptionId: string;
  scheduledDate: string;
  status: string;
  deliveredAt: string | null;
}
