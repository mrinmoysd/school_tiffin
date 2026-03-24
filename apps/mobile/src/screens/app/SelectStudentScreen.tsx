import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { studentsApi, type Student } from '../../api/students';
import { ApiClientError } from '../../api/client/apiClient';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectStudent'>;

const formatGrade = (grade: Student['grade']) => {
  if (grade === null || grade === undefined || `${grade}`.trim().length === 0) {
    return 'N/A';
  }

  return `${grade}`;
};

export const SelectStudentScreen = ({ navigation, route }: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setError(null);

    try {
      const response = await studentsApi.getStudents();
      setStudents(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load students.');
      }
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadStudents();
      setLoading(false);
    };

    void run();
  }, [loadStudents]);

  useFocusEffect(
    useCallback(() => {
      void loadStudents();
    }, [loadStudents]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  }, [loadStudents]);

  const eligibleStudents = useMemo(
    () =>
      students.filter(student => {
        return student.school?.id === route.params.schoolId;
      }),
    [students, route.params.schoolId],
  );

  useEffect(() => {
    if (eligibleStudents.length === 0) {
      setSelectedStudentId(null);
      setSelectedStartDate(null);
      return;
    }

    if (!selectedStudentId || !eligibleStudents.some(student => student.id === selectedStudentId)) {
      setSelectedStudentId(eligibleStudents[0].id);
      setSelectedStartDate(null);
    }
  }, [eligibleStudents, selectedStudentId]);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const maxSelectableDate = useMemo(() => {
    const date = new Date(tomorrow);
    date.setMonth(date.getMonth() + 3);
    return date;
  }, [tomorrow]);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (isoDate: string) => {
    const [yearString, monthString, dayString] = isoDate.split('-');
    const date = new Date(Number(yearString), Number(monthString) - 1, Number(dayString));
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.action.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Select Student</Text>
      <Text style={styles.subtitle}>Choose who this subscription is for.</Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadStudents()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.studentsSection}>
        {eligibleStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No students found for this school</Text>
            <Text style={styles.emptySubtitle}>
              Add a student enrolled in this school to continue.
            </Text>
          </View>
        ) : (
          eligibleStudents.map(student => {
            const selected = selectedStudentId === student.id;

            return (
              <Pressable
                key={student.id}
                style={[styles.studentCard, selected && styles.studentCardSelected]}
                onPress={() => setSelectedStudentId(student.id)}
              >
                <View style={styles.studentRow}>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>

                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.fullName}</Text>
                    <Text style={styles.studentMeta}>Grade: {formatGrade(student.grade)}</Text>
                    <Text style={styles.studentMeta}>
                      School: {student.school?.name ?? 'Not assigned'}
                    </Text>

                    <Pressable
                      onPress={() =>
                        navigation.navigate('AddStudent', {
                          mealPlanId: route.params.mealPlanId,
                          schoolId: route.params.schoolId,
                          studentId: student.id,
                        })
                      }
                    >
                      <Text style={styles.editLink}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <AppButton
        title="Add New Student"
        variant="secondary"
        onPress={() =>
          navigation.navigate('AddStudent', {
            mealPlanId: route.params.mealPlanId,
            schoolId: route.params.schoolId,
          })
        }
      />

      {selectedStudentId ? (
        <View style={styles.dateWrapper}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Pressable style={styles.datePickerButton} onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.datePickerText}>
              {selectedStartDate ? formatDisplayDate(selectedStartDate) : 'Select date'}
            </Text>
            <Text style={styles.datePickerArrow}>v</Text>
          </Pressable>

          {datePickerVisible ? (
            <DateTimePicker
              value={
                selectedStartDate
                  ? (() => {
                      const [yearString, monthString, dayString] = selectedStartDate.split('-');
                      return new Date(
                        Number(yearString),
                        Number(monthString) - 1,
                        Number(dayString),
                      );
                    })()
                  : tomorrow
              }
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'default'}
              minimumDate={tomorrow}
              maximumDate={maxSelectableDate}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (Platform.OS === 'android') {
                  setDatePickerVisible(false);
                }

                if (event.type === 'dismissed') {
                  return;
                }

                if (date) {
                  setSelectedStartDate(formatDateForInput(date));
                }

                if (Platform.OS === 'ios') {
                  setDatePickerVisible(false);
                }
              }}
            />
          ) : null}
        </View>
      ) : null}

      <AppButton
        title="Continue to Review"
        onPress={() => {
          if (!selectedStudentId || !selectedStartDate) {
            return;
          }

          navigation.navigate('SubscriptionReview', {
            mealPlanId: route.params.mealPlanId,
            schoolId: route.params.schoolId,
            studentId: selectedStudentId,
            startDate: selectedStartDate,
          });
        }}
        disabled={!selectedStudentId || !selectedStartDate}
        style={styles.continueButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.neutral.slate50,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.neutral.slate50,
  },
  title: {
    color: themeColors.text.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: themeColors.text.secondary,
    fontSize: 14,
    marginBottom: 12,
  },
  errorCard: {
    borderRadius: 12,
    backgroundColor: themeColors.surface.dangerSoft,
    borderWidth: 1,
    borderColor: themeColors.border.danger,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: themeColors.text.dangerStrong,
    fontSize: 13,
    marginBottom: 6,
  },
  retryText: {
    color: themeColors.intent.infoStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  studentsSection: {
    marginBottom: 14,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
    backgroundColor: themeColors.neutral.white,
    padding: 14,
  },
  emptyTitle: {
    color: themeColors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: themeColors.text.muted,
    fontSize: 13,
  },
  studentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
    backgroundColor: themeColors.neutral.white,
    padding: 12,
    marginBottom: 10,
  },
  studentCardSelected: {
    borderColor: themeColors.border.infoAccent,
    backgroundColor: themeColors.surface.infoSofter,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: themeColors.neutral.slate400,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: themeColors.intent.info,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: themeColors.intent.info,
  },
  studentInfo: {
    marginLeft: 10,
    flex: 1,
  },
  studentName: {
    color: themeColors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  studentMeta: {
    color: themeColors.text.secondary,
    fontSize: 13,
    marginBottom: 2,
  },
  continueButton: {
    marginTop: 10,
  },
  dateWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },
  dateLabel: {
    marginBottom: 6,
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate300,
    backgroundColor: themeColors.neutral.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    color: themeColors.text.primary,
    fontSize: 15,
    flex: 1,
  },
  datePickerArrow: {
    color: themeColors.text.secondary,
    fontSize: 13,
    marginLeft: 8,
  },
  editLink: {
    marginTop: 6,
    color: themeColors.intent.infoStrong,
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
});
