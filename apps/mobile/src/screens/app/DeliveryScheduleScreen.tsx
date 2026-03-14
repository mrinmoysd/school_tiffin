import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, type DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { ApiClientError } from '../../api/client/apiClient';
import { subscriptionsApi, type SubscriptionScheduleDay } from '../../api/subscriptions';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliverySchedule'>;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });
};

const toDateKey = (value: string) => value.slice(0, 10);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return '#16A34A';
    case 'PAUSED':
      return '#F59E0B';
    case 'SCHEDULED':
      return '#2563EB';
    default:
      return '#64748B';
  }
};

export const DeliveryScheduleScreen = ({ route }: Props) => {
  const [schedule, setSchedule] = useState<SubscriptionScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setError(null);

    try {
      const response = await subscriptionsApi.getSubscriptionSchedule(route.params.subscriptionId);
      setSchedule(response);
      if (!selectedDate && response.length > 0) {
        setSelectedDate(toDateKey(response[0].scheduledDate));
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
    schedule.forEach(item => {
      map.set(toDateKey(item.scheduledDate), item);
    });
    return map;
  }, [schedule]);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    schedule.forEach(item => {
      const dateKey = toDateKey(item.scheduledDate);
      marks[dateKey] = {
        marked: true,
        dotColor: getStatusColor(item.status),
      };
    });

    if (selectedDate) {
      const existing = marks[selectedDate] ?? {};
      marks[selectedDate] = {
        ...existing,
        selected: true,
        selectedColor: '#0EA5E9',
      };
    }

    return marks;
  }, [schedule, selectedDate]);

  const selectedDay = selectedDate ? (scheduleByDate.get(selectedDate) ?? null) : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Delivery Calendar</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {schedule.length === 0 ? (
        <Text style={styles.emptyText}>No delivery schedule found.</Text>
      ) : null}

      {schedule.length > 0 ? (
        <>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            enableSwipeMonths
            style={styles.calendar}
            theme={{
              todayTextColor: '#0EA5E9',
              arrowColor: '#0EA5E9',
              monthTextColor: '#0F172A',
              textDayHeaderFontWeight: '600',
            }}
          />

          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.legendText}>Scheduled</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.legendText}>Delivered</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Paused</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.dateText}>
              {selectedDay ? formatDate(selectedDay.scheduledDate) : 'Select a date'}
            </Text>
            <Text style={styles.statusText}>
              Status: {selectedDay?.status ?? 'No delivery on this day'}
            </Text>
            {selectedDay?.deliveredAt ? (
              <Text style={styles.statusText}>
                Delivered At: {formatDate(selectedDay.deliveredAt)}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 18,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  dateText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusText: {
    color: '#475569',
    fontSize: 13,
  },
  legendCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  legendTitle: {
    color: '#0F172A',
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
    color: '#334155',
    fontSize: 13,
  },
});
