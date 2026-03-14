import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RazorpayCheckout, { RazorpayFailureData } from 'react-native-razorpay';
import { paymentsApi } from '../../api/payments';
import { ApiClientError } from '../../api/client/apiClient';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const formatMinorUnitsAmount = (amount: number, currency: string) => {
  const normalizedCurrency = currency.toUpperCase();
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;

  return `${normalizedCurrency} ${(normalizedAmount / 100).toFixed(2)}`;
};

const getRazorpayErrorMessage = (error: RazorpayFailureData) => {
  if (typeof error.description === 'string' && error.description.trim().length > 0) {
    return error.description;
  }

  if (typeof error.reason === 'string' && error.reason.trim().length > 0) {
    return error.reason;
  }

  return 'Payment was not completed. Please try again.';
};

const isRazorpayFailure = (value: unknown): value is RazorpayFailureData =>
  typeof value === 'object' && value !== null && ('description' in value || 'reason' in value);

export const PaymentScreen = ({ route, navigation }: Props) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const displayAmount = useMemo(() => {
    const numericAmount =
      typeof route.params.amount === 'string' ? Number(route.params.amount) : route.params.amount;

    return formatMinorUnitsAmount(numericAmount, route.params.currency);
  }, [route.params.amount, route.params.currency]);

  const onPayNow = async () => {
    setProcessing(true);
    setError(null);
    setStatusMessage(null);

    try {
      const paymentIntent = await paymentsApi.createPaymentIntent({
        subscriptionId: route.params.subscriptionId,
      });

      const checkoutResult = await RazorpayCheckout.open({
        key: paymentIntent.razorpayKeyId,
        amount: `${paymentIntent.amount}`,
        currency: paymentIntent.currency,
        name: 'School Tiffin',
        description: `Subscription ${paymentIntent.orderNumber}`,
        order_id: paymentIntent.razorpayOrderId,
        theme: {
          color: '#0EA5E9',
        },
      });

      await paymentsApi.verifyPayment({
        razorpayOrderId: checkoutResult.razorpay_order_id,
        razorpayPaymentId: checkoutResult.razorpay_payment_id,
        razorpaySignature: checkoutResult.razorpay_signature,
      });

      setStatusMessage('Payment successful. Subscription has been activated.');
      Alert.alert('Payment successful', 'Your subscription is now active.', [
        {
          text: 'View subscription',
          onPress: () =>
            navigation.replace('SubscriptionDetail', {
              subscriptionId: route.params.subscriptionId,
            }),
        },
      ]);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else if (isRazorpayFailure(requestError)) {
        setError(getRazorpayErrorMessage(requestError));
      } else {
        setError('Unable to process payment right now. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Subscription ID</Text>
        <Text style={styles.value}>{route.params.subscriptionId}</Text>
        <Text style={styles.label}>Amount payable</Text>
        <Text style={styles.value}>{displayAmount}</Text>
      </View>

      {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton title="Pay with Razorpay" onPress={() => void onPayNow()} loading={processing} />
      <AppButton
        title="Back to Review"
        onPress={() => navigation.goBack()}
        variant="secondary"
        disabled={processing}
        style={styles.secondaryButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  value: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 14,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  secondaryButton: {
    marginTop: 10,
  },
});
