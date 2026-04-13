import api from '@/lib/axios';
import { ApiResponse, AppNotification } from '@/types';

interface BackendNotification extends Omit<AppNotification, 'data'> {
  data?: string | Record<string, unknown> | null;
}

const parseNotificationData = (
  rawData?: string | Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (!rawData) return null;
  if (typeof rawData === 'object') return rawData;

  try {
    const parsed = JSON.parse(rawData);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const toNotification = (item: BackendNotification): AppNotification => ({
  ...item,
  data: parseNotificationData(item.data),
});

export const notificationService = {
  getAll: async (unreadOnly = false): Promise<AppNotification[]> => {
    const query = unreadOnly ? '?unreadOnly=true' : '';
    const response = await api.get<ApiResponse<BackendNotification[]>>(`/notifications${query}`);
    const list = response.data.data || [];
    return list.map(toNotification);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count',
    );
    return response.data.data?.unreadCount || 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
