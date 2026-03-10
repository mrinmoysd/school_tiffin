export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PhoneLogin: { prefillPhone?: string } | undefined;
  OtpVerification: { phone: string; expiresIn?: number };
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Home: undefined;
  SchoolList: undefined;
  Orders: undefined;
  SubscriptionDetail: { subscriptionId: string };
  PauseRequest: { subscriptionId: string };
};
