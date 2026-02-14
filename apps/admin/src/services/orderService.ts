import api from '@/lib/axios';
import { ApiResponse, Order, OrderFilters, PaymentTransaction } from '@/types';

export const orderService = {
  // Get all orders
  getAll: async (filters?: OrderFilters): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get<ApiResponse<Order[]>>(`/orders?${params.toString()}`);
    return response.data.data;
  },

  // Get order by ID
  getById: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  // Get order transactions
  getTransactions: async (orderId: string): Promise<PaymentTransaction[]> => {
    const response = await api.get<ApiResponse<PaymentTransaction[]>>(`/orders/${orderId}/transactions`);
    return response.data.data;
  },

  // Export orders to CSV
  exportCSV: async (filters?: OrderFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/orders/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
