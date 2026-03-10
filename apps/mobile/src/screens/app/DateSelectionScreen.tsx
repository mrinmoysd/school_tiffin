import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DateSelection'>;

export const DateSelectionScreen = ({ route }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Date Selection</Text>
      <Text style={styles.subtitle}>Student ID: {route.params.studentId}</Text>
      <Text style={styles.subtitle}>Meal Plan ID: {route.params.mealPlanId}</Text>
      <Text style={styles.subtitle}>School ID: {route.params.schoolId}</Text>
      <Text style={styles.helper}>Date selection flow is part of task 3.3.3.</Text>
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
