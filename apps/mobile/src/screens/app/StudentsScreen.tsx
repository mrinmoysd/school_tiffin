import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ApiClientError } from '../../api/client/apiClient';
import { studentsApi, type Student } from '../../api/students';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Students'>;

const formatGrade = (grade: Student['grade']) => {
  if (grade === null || grade === undefined || `${grade}`.trim().length === 0) {
    return '-';
  }

  return `${grade}`;
};

export const StudentsScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const hasFocusedOnceRef = useRef(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setError(null);

    try {
      const response = await studentsApi.getStudents();
      setStudents(response);
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

  const onDeleteStudent = (student: Student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.fullName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
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
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.subtitle}>Manage your student profiles from one place.</Text>
            <AppButton
              title="Add New Student"
              onPress={() => navigation.navigate('AddStudent', {})}
              style={styles.addButton}
            />
            <Text style={styles.swipeHint}>Swipe left on a student row for quick actions.</Text>
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
              overshootRight={false}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <Pressable
                    style={[styles.swipeAction, styles.swipeEditAction]}
                    onPress={() => onEditStudent(item)}
                  >
                    <Text style={styles.swipeActionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.swipeAction, styles.swipeDeleteAction]}
                    onPress={() => onDeleteStudent(item)}
                    disabled={isDeleting}
                  >
                    <Text style={styles.swipeActionText}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              )}
            >
              <View style={styles.studentCard}>
                <Text style={styles.studentName}>{item.fullName}</Text>
                <Text style={styles.studentMeta}>Grade: {formatGrade(item.grade)}</Text>
                <Text style={styles.studentMeta}>School: {item.school?.name ?? '-'}</Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.inlineAction, styles.inlineEdit]}
                    onPress={() => onEditStudent(item)}
                  >
                    <Text style={styles.inlineEditText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.inlineAction, styles.inlineDelete]}
                    onPress={() => onDeleteStudent(item)}
                    disabled={isDeleting}
                  >
                    <Text style={styles.inlineDeleteText}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
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
      backgroundColor: colors.neutral.slate50,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.neutral.slate50,
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingBottom: 28,
    },
    headerBlock: {
      marginBottom: 12,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 13,
    },
    addButton: {
      marginTop: 12,
    },
    swipeHint: {
      marginTop: 10,
      color: colors.text.muted,
      fontSize: 12,
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
      marginBottom: 10,
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
    actionRow: {
      marginTop: 10,
      flexDirection: 'row',
    },
    inlineAction: {
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    inlineEdit: {
      backgroundColor: colors.surface.infoSubtle,
      marginRight: 8,
    },
    inlineDelete: {
      backgroundColor: colors.surface.dangerSubtle,
    },
    inlineEditText: {
      color: colors.intent.infoStrong,
      fontSize: 13,
      fontWeight: '700',
    },
    inlineDeleteText: {
      color: colors.intent.danger,
      fontSize: 13,
      fontWeight: '700',
    },
    swipeActions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 10,
    },
    swipeAction: {
      width: 84,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginLeft: 8,
    },
    swipeEditAction: {
      backgroundColor: colors.intent.infoStrong,
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
