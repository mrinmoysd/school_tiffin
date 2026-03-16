import { apiRequest } from '../client/apiClient';
import {
  NotificationItem,
  NotificationMessageResponse,
  NotificationUnreadCount,
} from './notificationsApi.types';

export const notificationsApi = {
  getNotifications: async (unreadOnly = false): Promise<NotificationItem[]> => {
    const query = unreadOnly ? '?unreadOnly=true' : '';

    return apiRequest<NotificationItem[]>(`/notifications${query}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  getUnreadCount: async (): Promise<NotificationUnreadCount> =>
    apiRequest<NotificationUnreadCount>('/notifications/unread-count', {
      method: 'GET',
      requiresAuth: true,
    }),

  markAsRead: async (notificationId: string): Promise<NotificationMessageResponse> =>
    apiRequest<NotificationMessageResponse>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      requiresAuth: true,
    }),

  markAllAsRead: async (): Promise<NotificationMessageResponse> =>
    apiRequest<NotificationMessageResponse>('/notifications/read-all', {
      method: 'PATCH',
      requiresAuth: true,
    }),
};
