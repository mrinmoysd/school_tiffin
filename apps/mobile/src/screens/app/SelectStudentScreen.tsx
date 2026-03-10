import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectStudent'>;

export const SelectStudentScreen = ({ route }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Student</Text>
      <Text style={styles.subtitle}>Meal Plan ID: {route.params.mealPlanId}</Text>
      <Text style={styles.subtitle}>School ID: {route.params.schoolId}</Text>
      <Text style={styles.helper}>Student selection flow is part of task 3.3.1.</Text>
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
