import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen = ({ route }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Subscription ID: {route.params.subscriptionId}</Text>
      <Text style={styles.subtitle}>
        Amount: {route.params.currency} {route.params.amount}
      </Text>
      <Text style={styles.helper}>Payment integration is part of task 3.3.4.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  helper: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
