export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PhoneLogin: { prefillPhone?: string } | undefined;
  OtpVerification: { phone: string; expiresIn?: number };
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Home: undefined;
  SchoolList: undefined;
  SchoolDetail: { schoolId: string };
  MealPlanDetail: { mealPlanId: string };
  SelectStudent: { mealPlanId: string; schoolId: string };
  Students: undefined;
  AddStudent: {
    mealPlanId?: string;
    schoolId?: string;
    studentId?: string;
  };
  DateSelection: { mealPlanId: string; schoolId: string; studentId: string };
  SubscriptionReview: {
    mealPlanId: string;
    schoolId: string;
    studentId: string;
    startDate: string;
  };
  Payment: { subscriptionId: string; amount: number | string; currency: string };
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  SubscriptionsList: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  SubscriptionDetail: { subscriptionId: string };
  DeliverySchedule: { subscriptionId: string };
  PauseRequest: { subscriptionId: string };
  PauseRequests: undefined;
};
