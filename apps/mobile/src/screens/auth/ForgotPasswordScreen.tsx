import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, FormTextInput } from '../../components/ui';
import { EMAIL_REGEX } from '../../constants/validation';
import { clearAuthErrors, clearAuthMessages, forgotPassword } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { forgotPasswordLoading, forgotPasswordError, forgotPasswordSuccessMessage } =
    useAppSelector(state => state.auth);

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  const onSubmit = (values: ForgotPasswordFormValues) => {
    void dispatch(
      forgotPassword({
        email: values.email.trim().toLowerCase(),
      }),
    );
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we will send you a password reset link."
    >
      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email is required',
          pattern: {
            value: EMAIL_REGEX,
            message: 'Please enter a valid email address',
          },
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error?.message}
          />
        )}
      />

      {forgotPasswordError ? <Text style={styles.error}>{forgotPasswordError}</Text> : null}
      {forgotPasswordSuccessMessage ? (
        <Text style={styles.success}>{forgotPasswordSuccessMessage}</Text>
      ) : null}

      <AppButton
        title="Send Reset Link"
        onPress={handleSubmit(onSubmit)}
        loading={forgotPasswordLoading}
      />

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to Login</Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  error: {
    color: themeColors.intent.danger,
    marginBottom: 10,
    fontSize: 13,
  },
  success: {
    color: themeColors.intent.successStrong,
    marginBottom: 10,
    fontSize: 13,
  },
  link: {
    marginTop: 14,
    color: themeColors.intent.infoStrong,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
});
