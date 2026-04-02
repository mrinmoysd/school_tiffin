import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { type UserProfile, usersApi } from '../../api/users';
import {
  AppButton,
  AppLoader,
  FoodDoodleBackdrop,
  FormTextInput,
  useAppAlert,
} from '../../components/ui';
import { INDIAN_PHONE_REGEX } from '../../constants/validation';
import { RootStackParamList } from '../../navigation/types';
import { setAuthUser } from '../../store/auth';
import { useAppDispatch } from '../../store/hooks';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

interface EditProfileFormValues {
  fullName: string;
  email: string;
  phone: string;
}

const normalizePhoneForInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  return digits.slice(0, 10);
};

const normalizePhoneForApi = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return undefined;
  }

  return `+91${digits}`;
};

const toAuthUser = (profile: UserProfile) => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.fullName,
  role: profile.role,
});

export const EditProfileScreen = ({ navigation }: Props) => {
  const { alert } = useAppAlert();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const dispatch = useAppDispatch();
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<EditProfileFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
    },
  });

  const emailValue = watch('email');

  const loadProfile = useCallback(async () => {
    setError(null);
    setInitialLoading(true);

    try {
      const profile = await usersApi.getCurrentUserProfile();
      reset({
        fullName: profile.fullName ?? '',
        email: profile.email ?? '',
        phone: normalizePhoneForInput(profile.phoneNumber ?? profile.phone),
      });
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load profile details right now.');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSubmit = async (values: EditProfileFormValues) => {
    setSubmitLoading(true);
    setError(null);

    try {
      const updatedProfile = await usersApi.updateCurrentUserProfile({
        fullName: values.fullName.trim(),
        phone: normalizePhoneForApi(values.phone),
      });

      dispatch(setAuthUser(toAuthUser(updatedProfile)));

      alert('Profile Updated', 'Your profile details have been updated.', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate('Profile');
          },
        },
      ]);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <AppLoader label="Loading your profile..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Update your basic account information.</Text>

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
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter full name"
              error={fieldError?.message}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}
        />

        <FormTextInput
          label="Email"
          value={emailValue}
          editable={false}
          selectTextOnFocus={false}
          placeholder="Email"
        />

        <Controller
          control={control}
          name="phone"
          rules={{
            validate: value =>
              value.trim().length === 0 ||
              INDIAN_PHONE_REGEX.test(value.trim()) ||
              'Enter a valid 10-digit mobile number',
          }}
          render={({ field: { value, onChange, onBlur }, fieldState: { error: fieldError } }) => (
            <FormTextInput
              label="Phone Number"
              value={value}
              onBlur={onBlur}
              onChangeText={text => onChange(text.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              error={fieldError?.message}
            />
          )}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppButton
          title="Save Changes"
          onPress={() => void handleSubmit(onSubmit)()}
          loading={submitLoading}
        />
        <AppButton
          title="Cancel"
          variant="secondary"
          style={styles.cancelButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate('Profile');
          }}
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
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingBottom: 28,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: 'transparent',
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 14,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    cancelButton: {
      marginTop: 10,
    },
  });
