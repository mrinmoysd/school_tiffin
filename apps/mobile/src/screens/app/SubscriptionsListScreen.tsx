import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientError } from '../../api/client/apiClient';
import { subscriptionsApi, type Subscription } from '../../api/subscriptions';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionsList'>;

type TabKey = 'ACTIVE' | 'COMPLETED';

const ACTIVE_STATUSES = new Set(['ACTIVE', 'PAUSED', 'PENDING_PAYMENT']);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusStyle = (
  status: Subscription['status'],
  colors: ReturnType<typeof useAppTheme>['colors'],
) => {
  switch (status) {
    case 'ACTIVE':
      return { backgroundColor: colors.surface.successSubtle };
    case 'PAUSED':
      return { backgroundColor: colors.surface.warningSoft };
    case 'COMPLETED':
      return { backgroundColor: colors.surface.infoSubtle };
    case 'PENDING_PAYMENT':
      return { backgroundColor: colors.surface.warningSubtle };
    default:
      return { backgroundColor: colors.neutral.slate100 };
  }
};

export const SubscriptionsListScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<TabKey>('ACTIVE');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setError(null);

    try {
      const response = await subscriptionsApi.getSubscriptions();
      setSubscriptions(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load subscriptions right now.');
      }
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadSubscriptions();
      setLoading(false);
    };

    void run();
  }, [loadSubscriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  }, [loadSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    if (activeTab === 'ACTIVE') {
      return subscriptions.filter(subscription => ACTIVE_STATUSES.has(subscription.status));
    }

    return subscriptions.filter(subscription => subscription.status === 'COMPLETED');
  }, [activeTab, subscriptions]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.pauseRequestsLink}
        onPress={() => navigation.navigate('PauseRequests')}
      >
        <Text style={styles.pauseRequestsLinkText}>View Pause Requests</Text>
      </Pressable>

      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'ACTIVE' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Active
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'COMPLETED' && styles.tabButtonActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            Completed
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={filteredSubscriptions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'ACTIVE' ? 'No active subscriptions' : 'No completed subscriptions'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'ACTIVE'
                ? 'Once you subscribe, active plans will show here.'
                : 'Completed plans will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{item.mealPlan.name}</Text>
              <View style={[styles.statusBadge, getStatusStyle(item.status, colors)]}>
                <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>

            <Text style={styles.metaText}>Student: {item.student.fullName}</Text>
            <Text style={styles.metaText}>
              Dates: {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
            <Text style={styles.metaText}>
              Remaining: {item.remainingDays}/{item.totalDays}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  navigation.navigate('SubscriptionDetail', { subscriptionId: item.id })
                }
              >
                <Text style={styles.viewButtonText}>View</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.pauseButton]}
                onPress={() => navigation.navigate('PauseRequest', { subscriptionId: item.id })}
                disabled={item.status === 'COMPLETED' || item.status === 'CANCELLED'}
              >
                <Text style={styles.pauseButtonText}>Pause</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.neutral.slate50,
      padding: 16,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.neutral.slate50,
    },
    tabsRow: {
      flexDirection: 'row',
      borderRadius: 12,
      backgroundColor: colors.neutral.slate200,
      padding: 4,
      marginBottom: 12,
    },
    pauseRequestsLink: {
      alignSelf: 'flex-start',
      marginBottom: 10,
      borderRadius: 999,
      backgroundColor: colors.surface.infoSoft,
      borderWidth: 1,
      borderColor: colors.border.infoSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    pauseRequestsLinkText: {
      color: colors.intent.infoStrong,
      fontSize: 13,
      fontWeight: '700',
    },
    tabButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabButtonActive: {
      backgroundColor: colors.neutral.white,
    },
    tabText: {
      color: colors.text.secondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.text.primary,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    listContent: {
      paddingBottom: 24,
      flexGrow: 1,
    },
    emptyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 16,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 13,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    planName: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusActive: {
      backgroundColor: colors.surface.successSubtle,
    },
    statusPaused: {
      backgroundColor: colors.surface.warningSoft,
    },
    statusCompleted: {
      backgroundColor: colors.surface.infoSubtle,
    },
    statusPending: {
      backgroundColor: colors.surface.warningSubtle,
    },
    statusCancelled: {
      backgroundColor: colors.neutral.slate100,
    },
    statusText: {
      color: colors.text.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    metaText: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 3,
    },
    actionsRow: {
      marginTop: 10,
      flexDirection: 'row',
    },
    actionButton: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButton: {
      backgroundColor: colors.surface.infoSubtle,
      marginRight: 8,
    },
    pauseButton: {
      backgroundColor: colors.surface.warningSoft,
    },
    viewButtonText: {
      color: colors.intent.infoStrong,
      fontSize: 13,
      fontWeight: '700',
    },
    pauseButtonText: {
      color: colors.text.warning,
      fontSize: 13,
      fontWeight: '700',
    },
  });
