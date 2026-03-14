import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientError } from '../../api/client/apiClient';
import { subscriptionsApi, type SubscriptionDetails } from '../../api/subscriptions';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionDetail'>;

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

const formatMoney = (value: number, currency: string) => `${currency} ${(value / 100).toFixed(2)}`;

const canCancelSubscription = (status: string) => status !== 'COMPLETED' && status !== 'CANCELLED';

export const SubscriptionDetailScreen = ({ route, navigation }: Props) => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setError(null);

    try {
      const response = await subscriptionsApi.getSubscriptionById(route.params.subscriptionId);
      setSubscription(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load subscription details.');
      }
    }
  }, [route.params.subscriptionId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadDetail();
      setLoading(false);
    };

    void run();
  }, [loadDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  }, [loadDetail]);

  const showCancelButton = useMemo(
    () => (subscription ? canCancelSubscription(subscription.status) : false),
    [subscription],
  );

  const handleCancel = () => {
    if (!subscription || !showCancelButton) {
      return;
    }

    Alert.alert('Cancel subscription', 'Are you sure you want to cancel this subscription?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          setError(null);

          try {
            const result = await subscriptionsApi.cancelSubscription(subscription.id);
            Alert.alert(
              'Cancelled',
              `${result.message}\nRefund: ${formatMoney(result.refundAmount, subscription.currency)}`,
            );
            await loadDetail();
          } catch (requestError) {
            if (requestError instanceof ApiClientError) {
              setError(requestError.message);
            } else {
              setError('Unable to cancel subscription right now.');
            }
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Subscription not found.'}</Text>
        <AppButton title="Retry" onPress={() => void loadDetail()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription Details</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan</Text>
        <Text style={styles.line}>{subscription.mealPlan.name}</Text>
        <Text style={styles.muted}>
          {subscription.mealPlan.description || 'No plan description available.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student</Text>
        <Text style={styles.line}>{subscription.student.fullName}</Text>
        <Text style={styles.muted}>Grade: {subscription.student.grade ?? '-'}</Text>
        <Text style={styles.muted}>School: {subscription.student.school.name}</Text>
        <Text style={styles.muted}>
          {subscription.student.school.city || '-'} {subscription.student.school.address || ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscription</Text>
        <Text style={styles.muted}>Subscription No: {subscription.subscriptionNumber}</Text>
        <Text style={styles.muted}>Status: {subscription.status}</Text>
        <Text style={styles.muted}>Start: {formatDate(subscription.startDate)}</Text>
        <Text style={styles.muted}>End: {formatDate(subscription.endDate)}</Text>
        <Text style={styles.muted}>
          Deliveries: {subscription.totalDays - subscription.remainingDays}/{subscription.totalDays}
        </Text>
        <Text style={styles.muted}>Remaining Days: {subscription.remainingDays}</Text>
        <Text style={styles.line}>
          Amount Paid: {formatMoney(subscription.totalPrice, subscription.currency)}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="View Delivery Schedule"
        onPress={() =>
          navigation.navigate('DeliverySchedule', {
            subscriptionId: subscription.id,
          })
        }
      />
      <AppButton
        title="Pause Subscription"
        onPress={() => navigation.navigate('PauseRequest', { subscriptionId: subscription.id })}
        variant="secondary"
        style={styles.secondaryButton}
      />
      {showCancelButton ? (
        <AppButton
          title="Cancel Subscription"
          onPress={handleCancel}
          loading={cancelling}
          style={styles.cancelButton}
        />
      ) : null}

      <AppButton
        title="Refresh"
        onPress={() => void onRefresh()}
        loading={refreshing}
        variant="secondary"
        style={styles.secondaryButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  line: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  muted: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  secondaryButton: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#DC2626',
  },
});
