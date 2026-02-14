export enum SubscriptionStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  MISSED = 'MISSED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  studentId: string;
  mealPlanId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  deliveredDays: number;
  pausedDays: number;
  remainingDays: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
