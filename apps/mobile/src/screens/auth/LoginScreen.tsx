import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, FormTextInput } from '../../components/ui';
import { EMAIL_REGEX } from '../../constants/validation';
import { clearAuthErrors, login } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const dispatch = useAppDispatch();
  const { loginLoading, loginError } = useAppSelector(state => state.auth);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [dispatch]);

  const onSubmit = (values: LoginFormValues) => {
    void dispatch(login(values));
  };

  return (
    <AuthLayout title="Login" subtitle="Sign in with your email and password.">
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
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Password is required',
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

      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      {loginError ? <Text style={styles.error}>{loginError}</Text> : null}

      <AppButton title="Login" onPress={handleSubmit(onSubmit)} loading={loginLoading} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>New here?</Text>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}> Sign up</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('PhoneLogin')}>
        <Text style={styles.secondaryLink}>Login with phone OTP</Text>
      </Pressable>
    </AuthLayout>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    link: {
      color: colors.intent.infoStrong,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 12,
    },
    secondaryLink: {
      color: colors.intent.infoStrong,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 16,
      fontWeight: '500',
    },
    error: {
      color: colors.intent.danger,
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
      color: colors.text.secondary,
      fontSize: 14,
    },
    footerLink: {
      color: colors.intent.infoStrong,
      fontSize: 14,
      fontWeight: '600',
    },
  });
