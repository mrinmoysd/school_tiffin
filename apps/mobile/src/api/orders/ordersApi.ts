import { apiRequest } from '../client/apiClient';
import { OrderDetail, OrderListItem, OrderStatus } from './ordersApi.types';

const normalizeOrderId = (value: string) => value.trim();

export const ordersApi = {
  getOrders: async (status?: OrderStatus): Promise<OrderListItem[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';

    return apiRequest<OrderListItem[]>(`/orders${query}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  getOrderById: async (orderId: string): Promise<OrderDetail> =>
    apiRequest<OrderDetail>(`/orders/${normalizeOrderId(orderId)}`, {
      method: 'GET',
      requiresAuth: true,
    }),
};
