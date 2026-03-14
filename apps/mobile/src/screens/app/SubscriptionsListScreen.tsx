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

const getStatusStyle = (status: Subscription['status']) => {
  switch (status) {
    case 'ACTIVE':
      return styles.statusActive;
    case 'PAUSED':
      return styles.statusPaused;
    case 'COMPLETED':
      return styles.statusCompleted;
    case 'PENDING_PAYMENT':
      return styles.statusPending;
    default:
      return styles.statusCancelled;
  }
};

export const SubscriptionsListScreen = ({ navigation }: Props) => {
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
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#475569',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  errorText: {
    color: '#DC2626',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
    color: '#0F172A',
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
    backgroundColor: '#DCFCE7',
  },
  statusPaused: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusPending: {
    backgroundColor: '#FFEDD5',
  },
  statusCancelled: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  metaText: {
    color: '#475569',
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
    backgroundColor: '#DBEAFE',
    marginRight: 8,
  },
  pauseButton: {
    backgroundColor: '#FEF3C7',
  },
  viewButtonText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseButtonText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
});
