import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, FormTextInput } from '../../components/ui';
import { PASSWORD_STRENGTH_MESSAGE, PASSWORD_STRENGTH_REGEX } from '../../constants/validation';
import { clearAuthErrors, clearAuthMessages, resetPassword } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordScreen = ({ route, navigation }: Props) => {
  const dispatch = useAppDispatch();
  const token = route.params?.token ?? '';

  const { resetPasswordLoading, resetPasswordError, resetPasswordSuccessMessage } = useAppSelector(
    state => state.auth,
  );

  const { control, handleSubmit, watch } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      return;
    }

    try {
      await dispatch(
        resetPassword({
          token,
          newPassword: values.newPassword,
        }),
      ).unwrap();

      navigation.navigate('Login');
    } catch {
      // Error is already available in Redux state.
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Set a new password for your account using the reset link."
    >
      {!token ? <Text style={styles.error}>Reset token missing in the link.</Text> : null}

      <Controller
        control={control}
        name="newPassword"
        rules={{
          required: 'New password is required',
          validate: value => PASSWORD_STRENGTH_REGEX.test(value) || PASSWORD_STRENGTH_MESSAGE,
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          required: 'Please confirm your new password',
          validate: value => value === newPassword || 'Passwords do not match',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Confirm New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={error?.message}
          />
        )}
      />

      {resetPasswordError ? <Text style={styles.error}>{resetPasswordError}</Text> : null}
      {resetPasswordSuccessMessage ? (
        <Text style={styles.success}>{resetPasswordSuccessMessage}</Text>
      ) : null}

      <AppButton
        title="Reset Password"
        onPress={handleSubmit(onSubmit)}
        loading={resetPasswordLoading}
        disabled={!token}
      />

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to Login</Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  error: {
    color: '#DC2626',
    marginBottom: 10,
    fontSize: 13,
  },
  success: {
    color: '#15803D',
    marginBottom: 10,
    fontSize: 13,
  },
  link: {
    marginTop: 14,
    color: '#0369A1',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
});
