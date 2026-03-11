import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DateSelection'>;

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const formatDisplayDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const DateSelectionScreen = ({ route, navigation }: Props) => {
  const candidateDates = useMemo(() => {
    const values: string[] = [];
    const current = new Date();
    current.setHours(0, 0, 0, 0);

    for (let index = 0; index < 21; index += 1) {
      const date = new Date(current);
      date.setDate(current.getDate() + index);
      values.push(toISODate(date));
    }

    return values;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(candidateDates[0]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Select Start Date</Text>
      <Text style={styles.subtitle}>Choose when subscription delivery should begin.</Text>

      <View style={styles.dateList}>
        {candidateDates.map(date => {
          const selected = selectedDate === date;

          return (
            <Pressable
              key={date}
              style={[styles.dateOption, selected && styles.dateOptionSelected]}
              onPress={() => setSelectedDate(date)}
            >
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={[styles.dateText, selected && styles.dateTextSelected]}>
                {formatDisplayDate(date)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        title="Continue to Review"
        onPress={() =>
          navigation.navigate('SubscriptionReview', {
            mealPlanId: route.params.mealPlanId,
            schoolId: route.params.schoolId,
            studentId: route.params.studentId,
            startDate: selectedDate,
          })
        }
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
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: '#475569',
    fontSize: 14,
    marginBottom: 12,
  },
  dateList: {
    marginBottom: 16,
  },
  dateOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateOptionSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  dateText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#0C4A6E',
  },
});
