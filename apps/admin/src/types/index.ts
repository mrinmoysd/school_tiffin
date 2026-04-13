// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string | null;
    role: string;
    maxStudents?: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  maxStudents: number;
  emailVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
}

// School Types
export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactEmail?: string;
  contactPhone?: string;
  isServiceAvailable: boolean;
  deliveryInstructions?: string;
  operatingDays: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolDto {
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactEmail?: string;
  contactPhone?: string;
  operatingDays?: string;
  deliveryInstructions?: string;
}

export type UpdateSchoolDto = Omit<Partial<CreateSchoolDto>, 'code'> & {
  isServiceAvailable?: boolean;
};

// Meal Plan Types
export interface MealPlanTypeMaster {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: string;
  schoolId: string;
  mealPlanTypeId: string;
  name: string;
  description?: string;
  planType: string;
  durationDays: number;
  pricePerDay: number;
  totalPrice: number;
  currency: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  school?: School;
  mealPlanType?: MealPlanTypeMaster;
  menuItems?: MenuItem[];
}

export interface CreateMealPlanDto {
  schoolId: string;
  mealPlanTypeId: string;
  name: string;
  description?: string;
  planType?: string;
  durationDays: number;
  pricePerDay: number;
  totalPrice: number;
  currency?: string;
  isActive?: boolean;
  imageUrl?: string | null;
}

export interface UpdateMealPlanDto extends Partial<CreateMealPlanDto> {}

export interface CreateMealPlanTypeDto {
  code: string;
  displayName: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMealPlanTypeDto extends Partial<CreateMealPlanTypeDto> {}

export interface TaxSetting {
  key: string;
  taxPercentage: number;
  updatedAt: string;
  description?: string;
}

export interface BrandingSetting {
  key: string;
  logoUrl: string | null;
  updatedAt: string;
  description?: string;
}

// Menu Item Types
export interface MenuItem {
  id: string;
  mealPlanId: string;
  name: string;
  dayOfWeek?: string;
  dayNumber?: number;
  items: string;
  description?: string;
  calories?: number;
  allergenInfo?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemDto {
  mealPlanId: string;
  name: string;
  items: string;
  description?: string;
  dayOfWeek?: string;
  dayNumber?: number;
  calories?: number;
  allergenInfo?: string;
}

export interface UpdateMenuItemDto extends Partial<Omit<CreateMenuItemDto, 'mealPlanId'>> {}

// Student Types
export interface Student {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  dateOfBirth?: string;
  grade?: string;
  section?: string;
  schoolId?: string;
  allergies?: string;
  dietaryPreferences?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  school?: School;
  parent?: User;
}

// Subscription Types
export enum SubscriptionStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  parentId: string;
  studentId: string;
  schoolId: string;
  mealPlanId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  deliveredDays: number;
  pausedDays: number;
  remainingDays: number;
  totalPrice: number;
  currency: string;
  paidAmount: number;
  status: SubscriptionStatus;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  parent?: User;
  student?: Student;
  school?: School;
  mealPlan?: MealPlan;
  subscriptionDays?: SubscriptionDay[];
  pauseRequests?: PauseRequest[];
}

export enum DeliveryStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

export interface SubscriptionDay {
  id: string;
  subscriptionId: string;
  scheduledDate: string;
  status: DeliveryStatus;
  deliveryConfirmedAt?: string;
  notes?: string;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  orderNumber: string;
  subscriptionId: string;
  parentId: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod?: string;
  paymentGatewayOrderId?: string;
  notes?: string;
  paidAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
  parent?: User;
  transactions?: PaymentTransaction[];
}

export enum TransactionStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  transactionId: string;
  paymentGateway: string;
  gatewayTransactionId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Pause Request Types
export enum PauseRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

export interface PauseRequest {
  id: string;
  subscriptionId: string;
  parentId: string;
  startDate: string;
  endDate: string;
  pauseDays: number;
  affectedDays: number;
  newEndDate?: string;
  reason?: string;
  status: PauseRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
  parent?: User;
  approver?: User;
}

// Dashboard Types
export interface DashboardStats {
  activeSubscriptions: number;
  todayDeliveries: number;
  monthlyRevenue: number;
  pendingPauseRequests: number;
  activeSchools: number;
  totalParents: number;
  totalStudents: number;
  completedDeliveriesToday: number;
}

export interface RecentActivity {
  recentSubscriptions: Subscription[];
  recentOrders: Order[];
}

// Notification Types
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  notificationType?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

// Delivery Types
export interface DeliveryItem {
  id: string;
  studentName: string;
  grade?: string;
  schoolName: string;
  mealPlanName: string;
  subscriptionNumber: string;
  status: DeliveryStatus;
  parentPhone?: string;
  notes?: string;
}

// CMS Types
export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: number;
  isPublished: boolean;
  publishedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface CreateCMSPageDto {
  slug: string;
  title: string;
  content: string;
  isPublished?: boolean;
}

export interface UpdateCMSPageDto {
  title?: string;
  content?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

// Report Types
export interface SalesReport {
  totalRevenue: number;
  totalSubscriptions: number;
  averageOrderValue: number;
  schoolBreakdown: SchoolRevenueItem[];
  dailyRevenue: DailyRevenueItem[];
}

export interface SchoolRevenueItem {
  schoolId: string;
  schoolName: string;
  revenue: number;
  subscriptionCount: number;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number;
  subscriptions: number;
}

export interface SubscriptionsReport {
  activeBySchool: SchoolSubscriptionItem[];
  trends: SubscriptionTrendItem[];
}

export interface SchoolSubscriptionItem {
  schoolId: string;
  schoolName: string;
  activeCount: number;
  totalCount: number;
}

export interface SubscriptionTrendItem {
  date: string;
  newSubscriptions: number;
  completedSubscriptions: number;
  cancelledSubscriptions: number;
}

// Filter Types
export interface SchoolFilters {
  search?: string;
  city?: string;
  isServiceAvailable?: boolean;
}

export interface MealPlanFilters {
  schoolId?: string;
  mealPlanTypeId?: string;
  planType?: string;
  search?: string;
  isActive?: boolean;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  schoolId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PauseRequestFilters {
  status?: PauseRequestStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface DeliveryFilters {
  date: string;
  schoolId?: string;
  status?: DeliveryStatus;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  schoolId?: string;
}
