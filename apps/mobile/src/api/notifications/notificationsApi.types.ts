export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data?: string | null;
  notificationType?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationUnreadCount {
  unreadCount: number;
}

export interface NotificationMessageResponse {
  message: string;
}
