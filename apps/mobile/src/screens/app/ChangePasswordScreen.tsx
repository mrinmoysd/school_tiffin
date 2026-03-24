import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { AppButton, FormTextInput } from '../../components/ui';
import { PASSWORD_STRENGTH_MESSAGE, PASSWORD_STRENGTH_REGEX } from '../../constants/validation';
import { RootStackParamList } from '../../navigation/types';
import { authService } from '../../business/auth';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const ChangePasswordScreen = ({ navigation }: Props) => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, watch } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');
  const currentPasswordValue = watch('currentPassword');

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSubmitLoading(true);
    setError(null);

    try {
      const response = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      Alert.alert('Success', response.message || 'Password changed successfully.', [
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
        setError('Unable to change password right now. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>Update your password to keep your account secure.</Text>

      <Controller
        control={control}
        name="currentPassword"
        rules={{
          required: 'Current password is required',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error: fieldError } }) => (
          <FormTextInput
            label="Current Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={fieldError?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        rules={{
          required: 'New password is required',
          validate: value => PASSWORD_STRENGTH_REGEX.test(value) || PASSWORD_STRENGTH_MESSAGE,
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error: fieldError } }) => (
          <FormTextInput
            label="New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={fieldError?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmNewPassword"
        rules={{
          required: 'Please confirm your new password',
          validate: value => {
            if (value !== newPasswordValue) {
              return 'Passwords do not match';
            }

            if (value === currentPasswordValue) {
              return 'New password must be different from current password';
            }

            return true;
          },
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error: fieldError } }) => (
          <FormTextInput
            label="Confirm New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={fieldError?.message}
          />
        )}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="Update Password"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.neutral.slate50,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    color: themeColors.text.secondary,
    fontSize: 13,
    marginBottom: 14,
  },
  errorText: {
    color: themeColors.intent.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
});
