import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { studentsApi, type Student } from '../../api/students';
import { mealPlansApi, type MealPlanDetails } from '../../api/meal-plans';
import { schoolsApi, type SchoolDetails } from '../../api/schools';
import { subscriptionsApi } from '../../api/subscriptions';
import { ApiClientError } from '../../api/client/apiClient';
import { useAppTheme } from '../../theme';

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

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseISODateLocal = (isoDate: string) => {
  const [yearString, monthString, dayString] = isoDate.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  return new Date(year, month - 1, day);
};

const formatDate = (isoDate: string) =>
  parseISODateLocal(isoDate).toLocaleDateString(undefined, {
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
  const date = parseISODateLocal(startDate);
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
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [student, setStudent] = useState<Student | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanDetails | null>(null);
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const startDate = route.params.startDate;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <ActivityIndicator size="large" color={colors.action.primary} />
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="Proceed to Payment"
        onPress={() => void onProceedToPayment()}
        loading={submitting}
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
      padding: 16,
      paddingBottom: 24,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.neutral.slate50,
      paddingHorizontal: 24,
    },
    title: {
      color: colors.text.primary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 12,
    },
    summaryCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
      marginBottom: 12,
    },
    summaryLine: {
      color: colors.text.subtle,
      fontSize: 14,
      marginBottom: 4,
    },
    summaryTotal: {
      marginTop: 6,
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
  });
