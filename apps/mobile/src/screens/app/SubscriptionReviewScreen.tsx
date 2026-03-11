import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { studentsApi, type Student } from '../../api/students';
import { mealPlansApi, type MealPlanDetails } from '../../api/meal-plans';
import { schoolsApi, type SchoolDetails } from '../../api/schools';
import { subscriptionsApi } from '../../api/subscriptions';
import { ApiClientError } from '../../api/client/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionReview'>;

const WEEKDAY_TO_INDEX: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });

const parseOperatingDayIndexes = (operatingDays: string[] | string): Set<number> => {
  const raw = Array.isArray(operatingDays) ? operatingDays : operatingDays.split(',');
  const values = raw.map(day => day.trim().toUpperCase()).filter(Boolean);

  const indexes = values
    .map(day => WEEKDAY_TO_INDEX[day])
    .filter((value): value is number => value !== undefined);

  return new Set(indexes);
};

const buildPreviewSchedule = (
  startDate: string,
  numberOfDays: number,
  operatingDays: string[] | string,
): string[] => {
  const schedule: string[] = [];
  const date = new Date(`${startDate}T00:00:00`);
  const allowedDays = parseOperatingDayIndexes(operatingDays);
  let guard = 0;

  while (schedule.length < numberOfDays && guard < 730) {
    if (allowedDays.has(date.getDay())) {
      schedule.push(toISODate(date));
    }

    date.setDate(date.getDate() + 1);
    guard += 1;
  }

  return schedule;
};

export const SubscriptionReviewScreen = ({ route, navigation }: Props) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanDetails | null>(null);
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [startDate, setStartDate] = useState(route.params.startDate);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDateModalVisible, setStartDateModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentResponse, mealPlanResponse, schoolResponse] = await Promise.all([
        studentsApi.getStudentById(route.params.studentId),
        mealPlansApi.getMealPlanById(route.params.mealPlanId),
        schoolsApi.getSchoolDetails(route.params.schoolId),
      ]);

      setStudent(studentResponse);
      setMealPlan(mealPlanResponse);
      setSchool(schoolResponse);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load subscription review details.');
      }
    } finally {
      setLoading(false);
    }
  }, [route.params.mealPlanId, route.params.schoolId, route.params.studentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const schedulePreview = useMemo(() => {
    if (!mealPlan || !school) {
      return [];
    }

    return buildPreviewSchedule(startDate, mealPlan.durationDays, school.operatingDays);
  }, [mealPlan, school, startDate]);

  const endDate = useMemo(() => {
    if (schedulePreview.length === 0) {
      return null;
    }

    return schedulePreview[schedulePreview.length - 1];
  }, [schedulePreview]);

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

  const onProceedToPayment = async () => {
    if (!mealPlan || !student) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const subscription = await subscriptionsApi.createSubscription({
        studentId: student.id,
        mealPlanId: mealPlan.id,
        startDate,
        numberOfDays: mealPlan.durationDays,
      });

      navigation.navigate('Payment', {
        subscriptionId: subscription.id,
        amount: subscription.totalPrice,
        currency: subscription.currency,
      });
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to create subscription.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!student || !mealPlan || !school) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Missing review data.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription Review</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLine}>Student: {student.fullName}</Text>
        <Text style={styles.summaryLine}>Meal Plan: {mealPlan.name}</Text>
        <Text style={styles.summaryLine}>Start Date: {formatDate(startDate)}</Text>
        <Text style={styles.summaryLine}>
          End Date: {endDate ? formatDate(endDate) : 'Calculating...'}
        </Text>
        <Text style={styles.summaryLine}>Total Days: {mealPlan.durationDays}</Text>
        <Text style={styles.summaryLine}>
          Price/day: {mealPlan.currency} {mealPlan.pricePerDay}
        </Text>
        <Text style={styles.summaryTotal}>
          Total: {mealPlan.currency} {mealPlan.totalPrice}
        </Text>
      </View>

      <Pressable style={styles.changeDateButton} onPress={() => setStartDateModalVisible(true)}>
        <Text style={styles.changeDateLabel}>Select Start Date</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generated Delivery Schedule</Text>
        {schedulePreview.length === 0 ? (
          <Text style={styles.helperText}>Unable to generate preview schedule.</Text>
        ) : (
          schedulePreview.slice(0, 14).map(date => (
            <View style={styles.scheduleItem} key={date}>
              <Text style={styles.scheduleText}>{formatDate(date)}</Text>
            </View>
          ))
        )}
        {schedulePreview.length > 14 ? (
          <Text style={styles.helperText}>Showing first 14 of {schedulePreview.length} dates.</Text>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="Proceed to Payment"
        onPress={() => void onProceedToPayment()}
        loading={submitting}
      />

      <Modal
        visible={startDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStartDateModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setStartDateModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Start Date</Text>
            {candidateDates.map(date => (
              <Pressable
                key={date}
                style={[styles.modalOption, startDate === date && styles.modalOptionSelected]}
                onPress={() => {
                  setStartDate(date);
                  setStartDateModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{formatDate(date)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
  },
  summaryLine: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryTotal: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  changeDateButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  changeDateLabel: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  scheduleItem: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  scheduleText: {
    color: '#334155',
    fontSize: 13,
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
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
    maxHeight: '70%',
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
