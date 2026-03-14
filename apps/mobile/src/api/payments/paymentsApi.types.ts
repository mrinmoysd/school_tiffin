export interface CreatePaymentIntentPayload {
  subscriptionId: string;
}

export interface PaymentIntent {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  message: string;
  order: {
    id: string;
    subscriptionId: string;
    status: string;
    paidAt: string | null;
  };
}
