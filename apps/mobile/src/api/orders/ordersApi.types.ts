export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  subscriptionId: string;
  amount: number | string;
  finalAmount: number | string;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  subscription: {
    subscriptionNumber: string;
    student: {
      fullName: string;
    };
  };
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  paymentGateway: string;
  gatewayTransactionId?: string | null;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
}

export interface OrderDetail extends OrderListItem {
  taxAmount: number | string;
  discountAmount: number | string;
  paymentMethod?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  transactions: PaymentTransaction[];
}
