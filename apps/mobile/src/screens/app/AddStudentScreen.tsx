import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { schoolsApi, type School } from '../../api/schools';
import { studentsApi } from '../../api/students';
import { AppButton, AppLoader, FoodDoodleBackdrop, FormTextInput } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStudent'>;

interface StudentFormValues {
  fullName: string;
  dateOfBirth: string;
  grade: string;
  schoolId: string;
  allergies: string;
  dietaryPreferences: string;
}

const GRADE_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value: string) => {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const parsed = new Date(year, month - 1, day);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string): Date | null => {
  if (!isValidDateString(value)) {
    return null;
  }

  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeGradeValue = (grade: string | number | null) => {
  if (grade === null || grade === undefined) {
    return '';
  }

  return `${grade}`;
};

export const AddStudentScreen = ({ route, navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const params = route.params ?? {};
  const isEditMode = Boolean(params.studentId);
  const [schools, setSchools] = useState<School[]>([]);
  const [screenLoading, setScreenLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [dobDraftDate, setDobDraftDate] = useState<Date>(new Date());

  const { control, handleSubmit, setValue, watch } = useForm<StudentFormValues>({
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      grade: '',
      schoolId: params.schoolId ?? '',
      allergies: '',
      dietaryPreferences: '',
    },
  });

  const selectedSchoolId = watch('schoolId');

  const selectedSchoolName = useMemo(() => {
    const selected = schools.find(school => school.id === selectedSchoolId);
    return selected?.name ?? '';
  }, [schools, selectedSchoolId]);

  const loadData = useCallback(async () => {
    setScreenLoading(true);
    setError(null);

    try {
      const schoolsResponse = await schoolsApi.getSchools();
      setSchools(schoolsResponse);

      if (isEditMode && params.studentId) {
        const student = await studentsApi.getStudentById(params.studentId);
        setValue('fullName', student.fullName ?? '');
        setValue('grade', normalizeGradeValue(student.grade));
        setValue('schoolId', student.school?.id ?? params.schoolId ?? '');
      } else {
        setValue('schoolId', params.schoolId ?? '');
      }
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load student form data.');
      }
    } finally {
      setScreenLoading(false);
    }
  }, [isEditMode, params.schoolId, params.studentId, setValue]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSubmit = async (values: StudentFormValues) => {
    setSubmitLoading(true);
    setError(null);

    try {
      const payload = {
        fullName: values.fullName.trim(),
        grade: values.grade.trim(),
        schoolId: values.schoolId,
      };

      if (isEditMode && params.studentId) {
        await studentsApi.updateStudent(params.studentId, payload);
      } else {
        await studentsApi.createStudent(payload);
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      if (params.mealPlanId && params.schoolId) {
        navigation.navigate('SelectStudent', {
          mealPlanId: params.mealPlanId,
          schoolId: params.schoolId,
        });
        return;
      }

      navigation.navigate('Students');
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError(isEditMode ? 'Failed to update student.' : 'Failed to create student.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (screenLoading) {
    return (
      <View style={styles.centered}>
        <AppLoader label="Loading student form..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Enter student details to continue.</Text>

        <Controller
          control={control}
          name="fullName"
          rules={{
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Full name must be at least 2 characters',
            },
          }}
          render={({ field: { value, onChange, onBlur }, fieldState: { error: fieldError } }) => (
            <FormTextInput
              label="Full Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          rules={{
            required: 'Date of birth is required',
            validate: value => isValidDateString(value.trim()) || 'Enter date in YYYY-MM-DD format',
          }}
          render={({ field: { value, onChange, onBlur }, fieldState: { error: fieldError } }) => {
            const selectedDate = parseInputDate(value);

            return (
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <Pressable
                  style={styles.dropdown}
                  onPress={() => {
                    setDobDraftDate(selectedDate ?? new Date());
                    setDobPickerVisible(true);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {selectedDate ? formatDateForInput(selectedDate) : 'Select date'}
                  </Text>
                  <Text style={styles.dropdownArrow}>v</Text>
                </Pressable>
                {fieldError ? <Text style={styles.fieldError}>{fieldError.message}</Text> : null}

                {dobPickerVisible ? (
                  <DateTimePicker
                    value={dobDraftDate}
                    mode="date"
                    display={Platform.OS === 'android' ? 'calendar' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      if (Platform.OS === 'android') {
                        setDobPickerVisible(false);
                      }

                      if (event.type === 'dismissed') {
                        return;
                      }

                      if (date) {
                        setDobDraftDate(date);
                        onChange(formatDateForInput(date));
                        onBlur();
                      }

                      if (Platform.OS === 'ios') {
                        setDobPickerVisible(false);
                      }
                    }}
                  />
                ) : null}
              </View>
            );
          }}
        />

        <Controller
          control={control}
          name="grade"
          rules={{
            required: 'Grade is required',
          }}
          render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => (
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Grade</Text>
              <Pressable style={styles.dropdown} onPress={() => setGradeModalVisible(true)}>
                <Text style={styles.dropdownText}>{value || 'Select grade'}</Text>
                <Text style={styles.dropdownArrow}>v</Text>
              </Pressable>
              {fieldError ? <Text style={styles.fieldError}>{fieldError.message}</Text> : null}

              <Modal
                visible={gradeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setGradeModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setGradeModalVisible(false)}>
                  <Pressable
                    style={[styles.modalCard, styles.modalCardTall]}
                    onPress={() => undefined}
                  >
                    <Text style={styles.modalTitle}>Select Grade</Text>
                    <ScrollView
                      style={styles.modalOptionsList}
                      contentContainerStyle={styles.modalOptionsListContent}
                      showsVerticalScrollIndicator
                    >
                      {GRADE_OPTIONS.map(option => (
                        <Pressable
                          key={option}
                          style={styles.modalOption}
                          onPress={() => {
                            onChange(option);
                            setGradeModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalOptionText}>{option}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
          )}
        />

        <Controller
          control={control}
          name="schoolId"
          rules={{
            required: 'School selection is required',
          }}
          render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => (
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>School</Text>
              <Pressable style={styles.dropdown} onPress={() => setSchoolModalVisible(true)}>
                <Text style={styles.dropdownText}>{selectedSchoolName || 'Select school'}</Text>
                <Text style={styles.dropdownArrow}>v</Text>
              </Pressable>
              {fieldError ? <Text style={styles.fieldError}>{fieldError.message}</Text> : null}

              <Modal
                visible={schoolModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSchoolModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setSchoolModalVisible(false)}>
                  <Pressable style={styles.modalCard} onPress={() => undefined}>
                    <Text style={styles.modalTitle}>Select School</Text>
                    <ScrollView
                      style={styles.modalOptionsList}
                      contentContainerStyle={styles.modalOptionsListContent}
                      showsVerticalScrollIndicator
                    >
                      {schools.map(school => (
                        <Pressable
                          key={school.id}
                          style={styles.modalOption}
                          onPress={() => {
                            onChange(school.id);
                            setSchoolModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalOptionText}>{school.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
          )}
        />

        <Controller
          control={control}
          name="allergies"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormTextInput
              label="Allergies (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. peanuts"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
          )}
        />

        <Controller
          control={control}
          name="dietaryPreferences"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormTextInput
              label="Dietary Preferences (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. vegetarian"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
          )}
        />

        {error ? <Text style={styles.submitError}>{error}</Text> : null}

        <AppButton
          title={isEditMode ? 'Update Student' : 'Create Student'}
          onPress={handleSubmit(onSubmit)}
          loading={submitLoading}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      padding: 16,
      paddingBottom: 28,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    subtitle: {
      marginBottom: 12,
      color: colors.text.secondary,
      fontSize: 14,
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
    dropdown: {
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
    dropdownText: {
      color: colors.text.primary,
      fontSize: 15,
      flex: 1,
    },
    dropdownArrow: {
      color: colors.text.secondary,
      fontSize: 13,
      marginLeft: 8,
    },
    fieldError: {
      marginTop: 6,
      color: colors.intent.danger,
      fontSize: 12,
    },
    multilineInput: {
      minHeight: 90,
      textAlignVertical: 'top',
      paddingTop: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay.scrim,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      borderRadius: 14,
      backgroundColor: colors.neutral.white,
      padding: 14,
      maxHeight: '70%',
      width: '100%',
      maxWidth: 380,
      alignSelf: 'center',
    },
    modalCardTall: {
      minHeight: 250,
    },
    modalTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
    modalOptionsList: {
      flexGrow: 0,
    },
    modalOptionsListContent: {
      paddingBottom: 4,
    },
    modalOption: {
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    modalOptionText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    submitError: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
  });
