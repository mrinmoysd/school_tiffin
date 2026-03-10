import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PauseRequest'>;

export const PauseRequestScreen = ({ route }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pause Subscription</Text>
      <Text style={styles.subtitle}>Subscription ID: {route.params.subscriptionId}</Text>
      <Text style={styles.helper}>Pause flow implementation is part of task 3.5.1.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    color: '#334155',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  helper: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
