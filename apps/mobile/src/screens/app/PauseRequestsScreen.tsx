import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import {
  subscriptionsApi,
  type PauseRequestListItem,
  type PauseRequestStatus,
} from '../../api/subscriptions';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PauseRequests'>;
type FilterKey = 'ALL' | PauseRequestStatus;

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'PROCESSED', label: 'Processed' },
];

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

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

const getStatusBadgeStyle = (
  status: PauseRequestStatus,
  colors: ReturnType<typeof useAppTheme>['colors'],
) => {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: colors.surface.warningSubtle };
    case 'APPROVED':
      return { backgroundColor: colors.surface.successSubtle };
    case 'REJECTED':
      return { backgroundColor: colors.surface.dangerSubtle };
    case 'PROCESSED':
      return { backgroundColor: colors.surface.infoSubtle };
    default:
      return { backgroundColor: colors.surface.warningSubtle };
  }
};

export const PauseRequestsScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [requests, setRequests] = useState<PauseRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setError(null);

    try {
      const response = await subscriptionsApi.getPauseRequests(
        filter === 'ALL' ? undefined : filter,
      );
      setRequests(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load pause requests right now.');
      }
    }
  }, [filter]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadRequests();
      setLoading(false);
    };

    void run();
  }, [loadRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const handleCancelRequest = (request: PauseRequestListItem) => {
    Alert.alert('Cancel pause request', 'Are you sure you want to cancel this pending request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingId(request.id);
          setError(null);

          try {
            const response = await subscriptionsApi.cancelPauseRequest(request.id);
            Alert.alert('Cancelled', response.message);
            await loadRequests();
          } catch (requestError) {
            if (requestError instanceof ApiClientError) {
              setError(requestError.message);
            } else {
              setError('Unable to cancel pause request.');
            }
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersRow}>
        {FILTER_OPTIONS.map(option => (
          <Pressable
            key={option.key}
            style={[styles.filterChip, filter === option.key && styles.filterChipActive]}
            onPress={() => setFilter(option.key)}
          >
            <Text
              style={[styles.filterChipText, filter === option.key && styles.filterChipTextActive]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No pause requests</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? 'Pause requests will appear here after submission.'
                : `No ${filter.toLowerCase()} requests found.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.studentName}>{item.subscription.student.fullName}</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(item.status, colors)]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.metaText}>
              Subscription: {item.subscription.subscriptionNumber}
            </Text>
            <Text style={styles.metaText}>
              Pause: {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
            <Text style={styles.metaText}>Days paused: {item.pauseDays}</Text>
            <Text style={styles.metaText}>Requested: {formatDate(item.createdAt)}</Text>
            {item.reason ? <Text style={styles.reasonText}>Reason: {item.reason}</Text> : null}

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  navigation.navigate('SubscriptionDetail', { subscriptionId: item.subscriptionId })
                }
              >
                <Text style={styles.viewButtonText}>View Subscription</Text>
              </Pressable>

              {item.status === 'PENDING' ? (
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelRequest(item)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={styles.cancelButtonText}>
                    {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
                  </Text>
                </Pressable>
              ) : null}
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
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    filterChipActive: {
      borderColor: colors.action.primary,
      backgroundColor: colors.surface.infoSoft,
    },
    filterChipText: {
      color: colors.text.subtle,
      fontSize: 13,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: colors.intent.infoStrong,
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
    studentName: {
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
    statusPending: {
      backgroundColor: colors.surface.warningSubtle,
    },
    statusApproved: {
      backgroundColor: colors.surface.successSubtle,
    },
    statusRejected: {
      backgroundColor: colors.surface.dangerSubtle,
    },
    statusProcessed: {
      backgroundColor: colors.surface.infoSubtle,
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
    reasonText: {
      color: colors.text.subtle,
      fontSize: 13,
      marginTop: 4,
    },
    actionsRow: {
      marginTop: 10,
      flexDirection: 'row',
    },
    actionButton: {
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    viewButton: {
      backgroundColor: colors.surface.infoSubtle,
      flex: 1,
      marginRight: 8,
    },
    cancelButton: {
      backgroundColor: colors.surface.dangerSubtle,
      minWidth: 92,
    },
    viewButtonText: {
      color: colors.intent.infoStrong,
      fontSize: 13,
      fontWeight: '700',
    },
    cancelButtonText: {
      color: colors.text.dangerStrong,
      fontSize: 13,
      fontWeight: '700',
    },
  });
