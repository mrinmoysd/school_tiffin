import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { ordersApi, type OrderDetail } from '../../api/orders';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatMoney = (value: number | string, currency: string) => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return `${currency} ${value}`;
  }

  return `${currency} ${(numeric / 100).toFixed(2)}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeStatus = (status: string) => status.replace('_', ' ');

export const OrderDetailScreen = ({ route }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setError(null);

    try {
      const response = await ordersApi.getOrderById(route.params.orderId);
      setOrder(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load order details.');
      }
    }
  }, [route.params.orderId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadOrder();
      setLoading(false);
    };

    void run();
  }, [loadOrder]);

  const latestTransactionId = useMemo(() => {
    if (!order || order.transactions.length === 0) {
      return '-';
    }

    const latest = order.transactions[0];
    return latest.gatewayTransactionId || latest.transactionId || '-';
  }, [order]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Order not found.'}</Text>
        <AppButton title="Retry" onPress={() => void loadOrder()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order</Text>
        <Text style={styles.line}>Order Number: {order.orderNumber}</Text>
        <Text style={styles.muted}>Status: {normalizeStatus(order.status)}</Text>
        <Text style={styles.muted}>Created: {formatDateTime(order.createdAt)}</Text>
        <Text style={styles.muted}>Paid At: {formatDateTime(order.paidAt)}</Text>
        <Text style={styles.muted}>Cancelled At: {formatDateTime(order.cancelledAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscription</Text>
        <Text style={styles.line}>Subscription No: {order.subscription.subscriptionNumber}</Text>
        <Text style={styles.muted}>Student: {order.subscription.student.fullName}</Text>
        <Text style={styles.muted}>Subscription ID: {order.subscriptionId}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amount Breakdown</Text>
        <Text style={styles.muted}>Base Amount: {formatMoney(order.amount, order.currency)}</Text>
        <Text style={styles.muted}>Tax: {formatMoney(order.taxAmount, order.currency)}</Text>
        <Text style={styles.muted}>
          Discount: {formatMoney(order.discountAmount, order.currency)}
        </Text>
        <Text style={styles.line}>
          Final Amount: {formatMoney(order.finalAmount, order.currency)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        <Text style={styles.muted}>Payment Method: {order.paymentMethod || '-'}</Text>
        <Text style={styles.muted}>Payment Status: {normalizeStatus(order.status)}</Text>
        <Text style={styles.muted}>Latest Transaction ID: {latestTransactionId}</Text>

        {order.transactions.length > 0 ? (
          <View style={styles.transactionsSection}>
            <Text style={styles.transactionsTitle}>Transactions</Text>
            {order.transactions.map(transaction => (
              <View style={styles.transactionItem} key={transaction.id}>
                <Text style={styles.transactionLine}>
                  ID: {transaction.gatewayTransactionId || transaction.transactionId}
                </Text>
                <Text style={styles.transactionMeta}>
                  {transaction.paymentGateway.toUpperCase()} | {normalizeStatus(transaction.status)}
                </Text>
                <Text style={styles.transactionMeta}>
                  {formatMoney(transaction.amount, transaction.currency)} |{' '}
                  {formatDateTime(transaction.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No transactions recorded yet.</Text>
        )}
      </View>

      {order.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.muted}>{order.notes}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="Download Receipt (Coming Soon)"
        onPress={() => undefined}
        disabled
        variant="secondary"
      />
    </ScrollView>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.neutral.slate50,
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
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
      marginBottom: 10,
    },
    cardTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
    },
    line: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    muted: {
      color: colors.text.subtle,
      fontSize: 13,
      marginBottom: 8,
    },
    transactionsSection: {
      marginTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.neutral.slate200,
      paddingTop: 8,
    },
    transactionsTitle: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 8,
    },
    transactionItem: {
      borderRadius: 10,
      backgroundColor: colors.neutral.slate50,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      padding: 10,
      marginBottom: 8,
    },
    transactionLine: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 2,
    },
    transactionMeta: {
      color: colors.text.secondary,
      fontSize: 12,
      marginBottom: 2,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
  });
