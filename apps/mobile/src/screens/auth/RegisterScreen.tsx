import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, CheckboxField, FormTextInput } from '../../components/ui';
import {
  EMAIL_REGEX,
  INDIAN_PHONE_REGEX,
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_REGEX,
} from '../../constants/validation';
import { clearAuthErrors, register } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export const RegisterScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { registerLoading, registerError } = useAppSelector(state => state.auth);

  const { control, handleSubmit, watch } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const passwordValue = watch('password');

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [dispatch]);

  const onSubmit = (values: RegisterFormValues) => {
    const normalizedPhone = values.phone.trim();

    void dispatch(
      register({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalizedPhone ? `+91${normalizedPhone}` : undefined,
        password: values.password,
      }),
    );
  };

  return (
    <AuthLayout title="Create Account" subtitle="Register to continue with School Tiffin.">
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
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Full Name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

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

      <Controller
        control={control}
        name="phone"
        rules={{
          validate: value =>
            !value ||
            INDIAN_PHONE_REGEX.test(value.trim()) ||
            'Phone must be 10 digits (Indian number)',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Phone (optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            maxLength={10}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Password is required',
          validate: value => PASSWORD_STRENGTH_REGEX.test(value) || PASSWORD_STRENGTH_MESSAGE,
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Password"
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
          required: 'Please confirm your password',
          validate: value => value === passwordValue || 'Passwords do not match',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Confirm Password"
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
        name="acceptTerms"
        rules={{
          validate: value => value || 'You must accept Terms & Conditions',
        }}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <CheckboxField
            label="I accept Terms & Conditions"
            value={value}
            onValueChange={onChange}
            error={error?.message}
          />
        )}
      />

      {registerError ? <Text style={styles.error}>{registerError}</Text> : null}

      <AppButton title="Register" onPress={handleSubmit(onSubmit)} loading={registerLoading} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}> Login</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  error: {
    color: themeColors.intent.danger,
    marginBottom: 10,
    fontSize: 13,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: themeColors.text.secondary,
    fontSize: 14,
  },
  footerLink: {
    color: themeColors.intent.infoStrong,
    fontSize: 14,
    fontWeight: '600',
  },
});
