import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { notificationsApi, type NotificationItem } from '../../api/notifications';
import { AppButton } from '../../components/ui';
import { themeColors } from '../../theme';

const formatTimeAgo = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const NotificationsScreen = () => {
  const hasFocusedOnceRef = useRef(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    setError(null);

    try {
      const response = await notificationsApi.getNotifications();
      setNotifications(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load notifications right now.');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        if (!hasFocusedOnceRef.current) {
          setLoading(true);
          await loadNotifications();
          setLoading(false);
          hasFocusedOnceRef.current = true;
          return;
        }

        await loadNotifications();
      };

      void run();
    }, [loadNotifications]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const onMarkAsRead = async (notification: NotificationItem) => {
    if (notification.isRead) {
      return;
    }

    setActiveNotificationId(notification.id);
    setError(null);

    try {
      await notificationsApi.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(item =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to mark notification as read.');
      }
    } finally {
      setActiveNotificationId(null);
    }
  };

  const onMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    setError(null);

    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(item => (item.isRead ? item : { ...item, isRead: true, readAt: now })),
      );
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to mark all notifications as read.');
      }
    } finally {
      setMarkAllLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.action.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
            <AppButton
              title="Mark all as read"
              onPress={() => void onMarkAllAsRead()}
              loading={markAllLoading}
              disabled={unreadCount === 0}
              variant="secondary"
              style={styles.markAllButton}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You will see delivery, pause, and subscription updates here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMarking = activeNotificationId === item.id;

          return (
            <Pressable
              style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
              onPress={() => void onMarkAsRead(item)}
            >
              <View style={styles.itemTopRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.itemStatusRow}>
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}
                  <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {item.isRead ? 'Read' : isMarking ? 'Marking as read...' : 'Tap to mark as read'}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.neutral.slate50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.neutral.slate50,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  headerBlock: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: themeColors.text.secondary,
  },
  markAllButton: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    color: themeColors.intent.danger,
    fontSize: 13,
  },
  emptyCard: {
    marginTop: 8,
    backgroundColor: themeColors.neutral.white,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
    borderRadius: 12,
    padding: 14,
  },
  emptyTitle: {
    color: themeColors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: themeColors.text.muted,
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: themeColors.neutral.white,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemCardUnread: {
    borderColor: themeColors.border.info,
    backgroundColor: themeColors.surface.infoAlt,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemTitle: {
    flex: 1,
    color: themeColors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  itemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: themeColors.intent.infoStrong,
    marginRight: 6,
  },
  itemTime: {
    color: themeColors.text.muted,
    fontSize: 12,
  },
  itemBody: {
    color: themeColors.text.subtle,
    fontSize: 13,
    lineHeight: 18,
  },
  itemMeta: {
    marginTop: 8,
    color: themeColors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
