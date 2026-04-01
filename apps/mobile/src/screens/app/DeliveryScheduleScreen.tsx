import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientError } from '../../api/client/apiClient';
import { subscriptionsApi, type SubscriptionScheduleDay } from '../../api/subscriptions';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliverySchedule'>;

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateKey = (value: string) => {
  const [yearString, monthString, dayString] = value.split('-');
  return new Date(Number(yearString), Number(monthString) - 1, Number(dayString));
};

const formatDate = (value: string) =>
  fromDateKey(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });

const getStatusColor = (status: string, colors: ReturnType<typeof useAppTheme>['colors']) => {
  switch (status) {
    case 'DELIVERED':
      return colors.intent.success;
    case 'PAUSED':
      return colors.intent.warning;
    case 'SCHEDULED':
      return colors.intent.infoStrong;
    default:
      return colors.neutral.slate400;
  }
};

const buildMonthGrid = (monthDate: Date): Date[] => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

export const DeliveryScheduleScreen = ({ route }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [schedule, setSchedule] = useState<SubscriptionScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  const loadSchedule = useCallback(async () => {
    setError(null);

    try {
      const response = await subscriptionsApi.getSubscriptionSchedule(route.params.subscriptionId);
      setSchedule(response);

      if (!selectedDate && response.length > 0) {
        const initialDate = response[0].scheduledDate.slice(0, 10);
        setSelectedDate(initialDate);
        setVisibleMonth(fromDateKey(initialDate));
      }
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load schedule right now.');
      }
    }
  }, [route.params.subscriptionId, selectedDate]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadSchedule();
      setLoading(false);
    };

    void run();
  }, [loadSchedule]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, [loadSchedule]);

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, SubscriptionScheduleDay>();
    schedule.forEach(item => map.set(item.scheduledDate.slice(0, 10), item));
    return map;
  }, [schedule]);

  const monthGrid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const selectedDay = selectedDate ? (scheduleByDate.get(selectedDate) ?? null) : null;

  const visibleMonthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Delivery Schedule</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.monthHeader}>
        <Pressable
          style={styles.monthNavButton}
          onPress={() =>
            setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
        >
          <Text style={styles.monthNavLabel}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{visibleMonthLabel}</Text>
        <Pressable
          style={styles.monthNavButton}
          onPress={() =>
            setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
        >
          <Text style={styles.monthNavLabel}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekHeaderRow}>
          {WEEK_DAYS.map(day => (
            <Text key={day} style={styles.weekHeaderText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {monthGrid.map(date => {
            const dateKey = toDateKey(date);
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const dayEntry = scheduleByDate.get(dateKey);
            const isSelected = selectedDate === dateKey;

            return (
              <Pressable
                key={dateKey}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(dateKey)}
              >
                <Text style={[styles.dayText, !isCurrentMonth && styles.dayTextMuted]}>
                  {date.getDate()}
                </Text>
                {dayEntry ? (
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: getStatusColor(dayEntry.status, colors) },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.intent.infoStrong }]} />
          <Text style={styles.legendText}>Scheduled</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.intent.success }]} />
          <Text style={styles.legendText}>Delivered</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.intent.warning }]} />
          <Text style={styles.legendText}>Paused</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Day Details</Text>
        <Text style={styles.detailText}>Date: {selectedDate ? formatDate(selectedDate) : '-'}</Text>
        <Text style={styles.detailText}>Status: {selectedDay?.status ?? 'No delivery'}</Text>
        <Text style={styles.detailText}>
          Delivery Time:{' '}
          {selectedDay?.deliveredAt ? new Date(selectedDay.deliveredAt).toLocaleString() : '-'}
        </Text>
      </View>
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
    },
    title: {
      color: colors.text.primary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 10,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    monthNavButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.neutral.slate200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavLabel: {
      color: colors.text.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    monthLabel: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    calendarCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 10,
      marginBottom: 10,
    },
    weekHeaderRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekHeaderText: {
      flex: 1,
      textAlign: 'center',
      color: colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.2857%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
    },
    dayCellSelected: {
      backgroundColor: colors.surface.infoSoft,
    },
    dayText: {
      color: colors.text.primary,
      fontSize: 13,
    },
    dayTextMuted: {
      color: colors.neutral.slate400,
    },
    dayDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginTop: 4,
    },
    legendCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 12,
      marginBottom: 10,
    },
    legendTitle: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    legendText: {
      color: colors.text.subtle,
      fontSize: 13,
    },
    detailsCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 12,
    },
    detailsTitle: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
    },
    detailText: {
      color: colors.text.subtle,
      fontSize: 13,
      marginBottom: 6,
    },
  });
