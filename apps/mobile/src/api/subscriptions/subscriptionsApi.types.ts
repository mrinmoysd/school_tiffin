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

export interface SubscriptionDetails extends Subscription {
  cancelledAt?: string | null;
  activatedAt?: string | null;
  student: SubscriptionStudent & {
    school: {
      id: string;
      name: string;
      address?: string | null;
      city?: string | null;
    };
  };
  mealPlan: SubscriptionMealPlan & {
    description?: string | null;
  };
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

export interface CancelSubscriptionResponse {
  id: string;
  status: SubscriptionStatus;
  cancelledAt: string | null;
  refundAmount: number;
  message: string;
}

export interface CreatePauseRequestPayload {
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface PauseRequestImpact {
  daysAffected: number;
  currentEndDate: string;
  newEndDate: string;
  extensionDays: number;
}

export interface PauseRequestResponse {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  pauseDays: number;
  affectedDays: number;
  newEndDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  createdAt: string;
  impact: PauseRequestImpact;
}

export type PauseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface PauseRequestListItem {
  id: string;
  subscriptionId: string;
  parentId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  pauseDays: number;
  affectedDays: number;
  newEndDate: string;
  status: PauseRequestStatus;
  createdAt: string;
  processedAt?: string | null;
  subscription: {
    id: string;
    subscriptionNumber: string;
    student: {
      fullName: string;
    };
  };
}

export interface CancelPauseRequestResponse {
  message: string;
}
