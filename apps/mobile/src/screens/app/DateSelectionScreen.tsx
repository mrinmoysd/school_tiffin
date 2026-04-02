import React, { useMemo, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, FoodDoodleBackdrop } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DateSelection'>;

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const DateSelectionScreen = ({ route, navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
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

  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose a date from tomorrow up to the next 3 months.</Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Start Date</Text>
          <Pressable style={styles.dropdown} onPress={() => setPickerVisible(true)}>
            <Text style={styles.dropdownText}>{formatDisplayDate(selectedDate)}</Text>
            <Text style={styles.dropdownArrow}>v</Text>
          </Pressable>
        </View>

        {pickerVisible ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'default'}
            minimumDate={tomorrow}
            maximumDate={maxSelectableDate}
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (Platform.OS === 'android') {
                setPickerVisible(false);
              }

              if (event.type === 'dismissed') {
                return;
              }

              if (date) {
                setSelectedDate(date);
              }

              if (Platform.OS === 'ios') {
                setPickerVisible(false);
              }
            }}
          />
        ) : null}

        <AppButton
          title="Continue to Review"
          onPress={() =>
            navigation.navigate('SubscriptionReview', {
              mealPlanId: route.params.mealPlanId,
              schoolId: route.params.schoolId,
              studentId: route.params.studentId,
              startDate: formatDateForInput(selectedDate),
            })
          }
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
      paddingBottom: 24,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 14,
      marginBottom: 12,
    },
    fieldWrapper: {
      marginBottom: 16,
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
  });
