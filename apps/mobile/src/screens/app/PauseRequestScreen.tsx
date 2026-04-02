import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import {
  subscriptionsApi,
  type SubscriptionDetails,
  type SubscriptionScheduleDay,
} from '../../api/subscriptions';
import { AppButton, FormTextInput } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PauseRequest'>;
type PickerField = 'startDate' | 'endDate' | null;

const stripTime = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const parseDate = (value: string) => {
  const dateOnly = value.includes('T') ? value.slice(0, 10) : value;
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) {
    return stripTime(new Date(value));
  }

  return new Date(year, month - 1, day);
};

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const findDefaultStartDate = (today: Date, schedule: SubscriptionScheduleDay[], endDate: Date) => {
  const firstEligible = schedule
    .filter(day => day.status === 'SCHEDULED')
    .map(day => stripTime(parseDate(day.scheduledDate)))
    .find(day => day >= today && day <= endDate);

  return firstEligible ?? today;
};

const countAffectedDays = (
  startDate: Date,
  endDate: Date,
  schedule: SubscriptionScheduleDay[],
): number =>
  schedule.filter(day => {
    if (day.status !== 'SCHEDULED') {
      return false;
    }

    const scheduled = stripTime(parseDate(day.scheduledDate));
    return scheduled >= startDate && scheduled <= endDate;
  }).length;

export const PauseRequestScreen = ({ route, navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [schedule, setSchedule] = useState<SubscriptionScheduleDay[]>([]);
  const [screenLoading, setScreenLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pickerField, setPickerField] = useState<PickerField>(null);

  const today = useMemo(() => stripTime(new Date()), []);

  const subscriptionEndDate = useMemo(() => {
    if (!subscription) {
      return null;
    }

    return stripTime(parseDate(subscription.endDate));
  }, [subscription]);

  const impact = useMemo(() => {
    if (!subscription || !startDate || !endDate || !subscriptionEndDate) {
      return null;
    }

    const affectedDays = countAffectedDays(startDate, endDate, schedule);
    const newEndDate = addDays(subscriptionEndDate, affectedDays);

    return {
      affectedDays,
      currentEndDate: subscriptionEndDate,
      newEndDate,
      extensionDays: affectedDays,
    };
  }, [endDate, schedule, startDate, subscription, subscriptionEndDate]);

  const loadData = useCallback(async () => {
    setScreenLoading(true);
    setScreenError(null);
    setValidationError(null);

    try {
      const [subscriptionResponse, scheduleResponse] = await Promise.all([
        subscriptionsApi.getSubscriptionById(route.params.subscriptionId),
        subscriptionsApi.getSubscriptionSchedule(route.params.subscriptionId),
      ]);

      const endDateCandidate = stripTime(parseDate(subscriptionResponse.endDate));
      const clampedToday = today <= endDateCandidate ? today : endDateCandidate;
      const defaultStartDate = findDefaultStartDate(
        clampedToday,
        scheduleResponse,
        endDateCandidate,
      );
      const defaultEndDate =
        addDays(defaultStartDate, 1) <= endDateCandidate
          ? addDays(defaultStartDate, 1)
          : endDateCandidate;

      setSubscription(subscriptionResponse);
      setSchedule(scheduleResponse);
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setScreenError(requestError.message);
      } else {
        setScreenError('Unable to load pause request details.');
      }
    } finally {
      setScreenLoading(false);
    }
  }, [route.params.subscriptionId, today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const minimumEndDate = useMemo(() => {
    if (!startDate) {
      return today;
    }

    return addDays(startDate, 1);
  }, [startDate, today]);

  const endPickerMinimumDate = useMemo(
    () => (minimumEndDate <= subscriptionEndDate ? minimumEndDate : subscriptionEndDate),
    [minimumEndDate, subscriptionEndDate],
  );

  const validateForm = () => {
    if (!subscriptionEndDate || !startDate || !endDate) {
      return 'Please select both pause dates.';
    }

    if (startDate < today) {
      return 'Pause start date cannot be in the past.';
    }

    if (endDate <= startDate) {
      return 'Pause end date must be after start date.';
    }

    if (addDays(startDate, 1) > subscriptionEndDate) {
      return 'Subscription is too close to end date for a valid pause range.';
    }

    if (startDate > subscriptionEndDate || endDate > subscriptionEndDate) {
      return 'Pause dates must be within the subscription period.';
    }

    if (!impact || impact.affectedDays < 1) {
      return 'No scheduled delivery days were found in this range.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const errorMessage = validateForm();
    if (!startDate || !endDate || errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError(null);
    setScreenError(null);
    setSubmitLoading(true);

    try {
      const response = await subscriptionsApi.createPauseRequest({
        subscriptionId: route.params.subscriptionId,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        reason: reason.trim() || undefined,
      });

      Alert.alert(
        'Pause request submitted',
        `Affected days: ${response.impact.daysAffected}\nNew end date: ${formatDisplayDate(parseDate(response.impact.newEndDate))}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate('SubscriptionDetail', {
                subscriptionId: route.params.subscriptionId,
              });
            },
          },
        ],
      );
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setScreenError(requestError.message);
      } else {
        setScreenError('Unable to submit pause request.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (screenLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  if (!subscription || !subscriptionEndDate || !startDate || !endDate) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {screenError ?? 'Unable to load pause request details.'}
        </Text>
        <AppButton title="Retry" onPress={() => void loadData()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Select a pause range within your subscription period. Past dates are disabled.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Subscription</Text>
        <Text style={styles.infoValue}>{subscription.subscriptionNumber}</Text>
        <Text style={styles.infoMuted}>Student: {subscription.student.fullName}</Text>
        <Text style={styles.infoMuted}>
          Current End Date: {formatDisplayDate(subscriptionEndDate)}
        </Text>
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Pause From</Text>
        <Pressable style={styles.dateField} onPress={() => setPickerField('startDate')}>
          <Text style={styles.dateFieldText}>{formatDisplayDate(startDate)}</Text>
          <Text style={styles.dateFieldArrow}>v</Text>
        </Pressable>
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Pause To</Text>
        <Pressable style={styles.dateField} onPress={() => setPickerField('endDate')}>
          <Text style={styles.dateFieldText}>{formatDisplayDate(endDate)}</Text>
          <Text style={styles.dateFieldArrow}>v</Text>
        </Pressable>
      </View>

      <FormTextInput
        label="Reason (optional)"
        value={reason}
        onChangeText={setReason}
        placeholder="Add reason for pause request"
        multiline
        numberOfLines={3}
        style={styles.reasonInput}
      />

      {impact ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Impact Preview</Text>
          <Text style={styles.previewText}>Paused Days: {impact.affectedDays}</Text>
          <Text style={styles.previewText}>
            Current End Date: {formatDisplayDate(impact.currentEndDate)}
          </Text>
          <Text style={styles.previewText}>
            New End Date: {formatDisplayDate(impact.newEndDate)}
          </Text>
        </View>
      ) : null}

      {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

      <AppButton
        title="Submit Request"
        onPress={() => void handleSubmit()}
        loading={submitLoading}
      />

      {pickerField ? (
        <DateTimePicker
          value={pickerField === 'startDate' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          minimumDate={pickerField === 'startDate' ? today : endPickerMinimumDate}
          maximumDate={subscriptionEndDate}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === 'android') {
              setPickerField(null);
            }

            if (event.type === 'dismissed' || !date) {
              return;
            }

            const normalized = stripTime(date);

            if (pickerField === 'startDate') {
              setStartDate(normalized);
              if (endDate <= normalized) {
                const nextEnd = addDays(normalized, 1);
                setEndDate(nextEnd <= subscriptionEndDate ? nextEnd : subscriptionEndDate);
              }
            } else {
              setEndDate(normalized);
            }

            setValidationError(null);

            if (Platform.OS === 'ios') {
              setPickerField(null);
            }
          }}
        />
      ) : null}
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
      paddingBottom: 28,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: colors.neutral.slate50,
    },
    subtitle: {
      marginBottom: 12,
      color: colors.text.secondary,
      fontSize: 14,
    },
    infoCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
      marginBottom: 14,
    },
    infoLabel: {
      color: colors.text.muted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    infoValue: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 2,
      marginBottom: 4,
    },
    infoMuted: {
      color: colors.text.subtle,
      fontSize: 13,
      marginTop: 2,
    },
    fieldWrapper: {
      marginBottom: 14,
    },
    fieldLabel: {
      marginBottom: 6,
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    dateField: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateFieldText: {
      color: colors.text.primary,
      fontSize: 15,
      flex: 1,
    },
    dateFieldArrow: {
      color: colors.text.secondary,
      fontSize: 13,
      marginLeft: 8,
    },
    reasonInput: {
      minHeight: 90,
      textAlignVertical: 'top',
      paddingTop: 10,
    },
    previewCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.infoLight,
      backgroundColor: colors.surface.infoSofter,
      padding: 14,
      marginBottom: 12,
    },
    previewTitle: {
      color: colors.text.infoDark,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
    },
    previewText: {
      color: colors.text.infoDeeper,
      fontSize: 13,
      marginBottom: 4,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
  });
