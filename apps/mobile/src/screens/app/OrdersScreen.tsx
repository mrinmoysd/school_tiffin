import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { ordersApi, type OrderListItem, type OrderStatus } from '../../api/orders';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;
type OrderFilter = 'ALL' | OrderStatus;

const PAGE_SIZE = 10;
const FILTER_OPTIONS: Array<{ value: OrderFilter; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

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

const formatAmount = (value: number | string, currency: string) => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return `${currency} ${value}`;
  }

  return `${currency} ${(numeric / 100).toFixed(2)}`;
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'PAID':
      return styles.statusPaid;
    case 'PENDING':
      return styles.statusPending;
    case 'PROCESSING':
      return styles.statusProcessing;
    case 'FAILED':
      return styles.statusFailed;
    case 'REFUNDED':
      return styles.statusRefunded;
    case 'CANCELLED':
      return styles.statusCancelled;
    default:
      return styles.statusPending;
  }
};

export const OrdersScreen = ({ navigation }: Props) => {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const selectedFilterLabel = useMemo(
    () => FILTER_OPTIONS.find(option => option.value === filter)?.label ?? 'All statuses',
    [filter],
  );

  const loadOrders = useCallback(async () => {
    setError(null);

    try {
      const response = await ordersApi.getOrders(filter === 'ALL' ? undefined : filter);
      setOrders(response);
      setPage(1);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load orders right now.');
      }
    }
  }, [filter]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadOrders();
      setLoading(false);
    };

    void run();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const visibleOrders = useMemo(() => orders.slice(0, page * PAGE_SIZE), [orders, page]);
  const hasMore = visibleOrders.length < orders.length;

  const handleLoadMore = () => {
    if (!hasMore || loading || refreshing) {
      return;
    }

    setPage(current => current + 1);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
        <Text style={styles.filterButtonLabel}>Status: {selectedFilterLabel}</Text>
        <Text style={styles.filterButtonArrow}>v</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={visibleOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? 'Your orders will appear here after successful payments.'
                : `No ${filter.toLowerCase()} orders available.`}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null
        }
        onEndReachedThreshold={0.2}
        onEndReached={handleLoadMore}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.metaText}>
              Subscription: {item.subscription.subscriptionNumber}
            </Text>
            <Text style={styles.metaText}>Student: {item.subscription.student.fullName}</Text>
            <Text style={styles.metaText}>
              Amount: {formatAmount(item.finalAmount, item.currency)}
            </Text>
            <Text style={styles.metaText}>Date: {formatDate(item.createdAt)}</Text>
          </Pressable>
        )}
      />

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter by Status</Text>
            {FILTER_OPTIONS.map(option => (
              <Pressable
                key={option.value}
                style={[styles.modalOption, filter === option.value && styles.modalOptionSelected]}
                onPress={() => {
                  setFilter(option.value);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  filterButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterButtonLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonArrow: {
    color: '#475569',
    fontSize: 13,
    marginLeft: 8,
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
  orderNumber: {
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
  statusPending: {
    backgroundColor: '#FFEDD5',
  },
  statusProcessing: {
    backgroundColor: '#E0F2FE',
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusRefunded: {
    backgroundColor: '#EDE9FE',
  },
  statusCancelled: {
    backgroundColor: '#E2E8F0',
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
  loadMoreButton: {
    marginTop: 4,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loadMoreText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalOption: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#E0F2FE',
  },
  modalOptionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
});
