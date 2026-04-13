import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ApiClientError } from '../../api/client/apiClient';
import { studentsApi, type Student } from '../../api/students';
import { usersApi } from '../../api/users';
import { AppLoader, FoodDoodleBackdrop, ProfileAvatar, useAppAlert } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { getStudentLimitReachedMessage, hasReachedStudentLimit } from '../../utils/studentLimit';

type Props = NativeStackScreenProps<RootStackParamList, 'Students'>;

const formatGrade = (grade: Student['grade']) => {
  if (grade === null || grade === undefined || `${grade}`.trim().length === 0) {
    return '-';
  }

  return `${grade}`;
};

export const StudentsScreen = ({ navigation }: Props) => {
  const { alert } = useAppAlert();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const hasFocusedOnceRef = useRef(false);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxStudents, setMaxStudents] = useState<number | null>(null);

  const loadStudents = useCallback(async () => {
    setError(null);

    try {
      const response = await studentsApi.getStudents();
      setStudents(response);

      try {
        const profile = await usersApi.getCurrentUserProfile();
        setMaxStudents(typeof profile.maxStudents === 'number' ? profile.maxStudents : null);
      } catch {
        // Keep existing limit if profile refresh fails.
      }
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load students right now.');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        if (!hasFocusedOnceRef.current) {
          setLoading(true);
          await loadStudents();
          setLoading(false);
          hasFocusedOnceRef.current = true;
          return;
        }

        await loadStudents();
      };

      void run();
    }, [loadStudents]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const onEditStudent = (student: Student) => {
    navigation.navigate('AddStudent', {
      studentId: student.id,
      schoolId: student.school?.id,
    });
  };

  const onAddStudent = useCallback(() => {
    const studentLimit = typeof maxStudents === 'number' ? maxStudents : null;
    if (studentLimit !== null && hasReachedStudentLimit(students.length, studentLimit)) {
      alert('Student limit reached', getStudentLimitReachedMessage(students.length, studentLimit), [
        { text: 'OK' },
      ]);
      return;
    }

    navigation.navigate('AddStudent', {});
  }, [alert, maxStudents, navigation, students.length]);

  const closeSwipeableRow = (studentId: string) => {
    swipeableRefs.current[studentId]?.close();
  };

  const onDeleteStudent = (student: Student) => {
    if (deletingStudentId === student.id) {
      return;
    }

    alert(
      'Delete Student',
      `Are you sure you want to delete ${student.fullName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => closeSwipeableRow(student.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingStudentId(student.id);

            try {
              await studentsApi.deleteStudent(student.id);
              setStudents(prev => prev.filter(item => item.id !== student.id));
            } catch (requestError) {
              if (requestError instanceof ApiClientError) {
                setError(requestError.message);
              } else {
                setError('Unable to delete student right now.');
              }
            } finally {
              setDeletingStudentId(null);
              closeSwipeableRow(student.id);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <AppLoader label="Loading students..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.headerRow}>
              <Pressable
                style={styles.addStudentButton}
                onPress={onAddStudent}
                accessibilityRole="button"
                accessibilityLabel="Add new student"
              >
                <Ionicons name="person-add-outline" size={18} color={colors.neutral.white} />
                <Text style={styles.addStudentButtonText}>Add Student</Text>
              </Pressable>
            </View>
            <View style={styles.hintRow}>
              <View style={styles.hintLine} />
              <View style={styles.hintContent}>
                <Ionicons name="information-circle-outline" size={14} color={colors.text.muted} />
                <Text style={styles.swipeHint}>
                  Tap/Swipe left on a student row for quick actions
                </Text>
              </View>
              <View style={styles.hintLine} />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No students added yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first student to continue with subscriptions.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDeleting = deletingStudentId === item.id;

          return (
            <Swipeable
              ref={ref => {
                swipeableRefs.current[item.id] = ref;
              }}
              overshootRight={false}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <Pressable
                    style={[styles.swipeAction, styles.swipeDeleteAction]}
                    onPress={() => onDeleteStudent(item)}
                    disabled={isDeleting}
                  >
                    <Text style={styles.swipeActionText}>
                      {isDeleting ? 'Deleting...' : 'Delete Student'}
                    </Text>
                  </Pressable>
                </View>
              )}
            >
              <Pressable style={styles.studentCard} onPress={() => onEditStudent(item)}>
                <View style={styles.studentTopRow}>
                  <ProfileAvatar imageUrl={item.profileImageUrl} name={item.fullName} size={52} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.fullName}</Text>
                    <Text style={styles.studentMeta}>Grade: {formatGrade(item.grade)}</Text>
                    <Text style={styles.studentMeta}>School: {item.school?.name ?? '-'}</Text>
                  </View>
                </View>
              </Pressable>
            </Swipeable>
          );
        }}
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingBottom: 28,
    },
    headerBlock: {
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    addStudentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.action.primary,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    addStudentButtonText: {
      color: colors.neutral.white,
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 7,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    hintLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.neutral.slate300,
    },
    hintContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    swipeHint: {
      color: colors.text.muted,
      fontSize: 12,
      marginLeft: 4,
    },
    errorText: {
      marginTop: 8,
      color: colors.intent.danger,
      fontSize: 13,
    },
    emptyCard: {
      marginTop: 8,
      backgroundColor: colors.neutral.white,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      borderRadius: 12,
      padding: 14,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 13,
    },
    studentCard: {
      backgroundColor: colors.neutral.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      padding: 14,
      minHeight: 100,
      marginBottom: 10,
    },
    studentTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    studentInfo: {
      marginLeft: 10,
      flex: 1,
    },
    studentName: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    studentMeta: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 4,
    },
    swipeActions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 10,
    },
    swipeAction: {
      width: 92,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginLeft: 8,
    },
    swipeDeleteAction: {
      backgroundColor: colors.intent.danger,
    },
    swipeActionText: {
      color: colors.neutral.white,
      fontSize: 13,
      fontWeight: '700',
    },
  });
