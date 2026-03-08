import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, FormTextInput } from '../../components/ui';
import { clearAuthErrors, sendOtp, setOtpExpiry, verifyOtp } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

interface OtpFormValues {
  otp: string;
}

const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const OtpVerificationScreen = ({ route, navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { phone } = route.params;
  const { verifyOtpLoading, sendOtpLoading, otpError, otpExpiresAt } = useAppSelector(
    state => state.auth,
  );

  const fallbackExpiry = useMemo(() => {
    const expiresInSeconds = route.params.expiresIn ?? 300;
    return Date.now() + expiresInSeconds * 1000;
  }, [route.params.expiresIn]);

  const activeExpiry = otpExpiresAt ?? fallbackExpiry;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.floor((activeExpiry - Date.now()) / 1000)),
  );

  const { control, handleSubmit } = useForm<OtpFormValues>({
    defaultValues: {
      otp: '',
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [dispatch]);

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Math.floor((activeExpiry - Date.now()) / 1000)));
  }, [activeExpiry]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingSeconds]);

  const onVerify = (values: OtpFormValues) => {
    void dispatch(
      verifyOtp({
        phone,
        otp: values.otp.trim(),
      }),
    );
  };

  const onResend = async () => {
    if (remainingSeconds > 0 || sendOtpLoading) {
      return;
    }

    try {
      const response = await dispatch(sendOtp({ phone })).unwrap();
      const nextExpiry = Date.now() + response.expiresIn * 1000;
      dispatch(setOtpExpiry(nextExpiry));
      setRemainingSeconds(response.expiresIn);
    } catch {
      // Error is handled in Redux state and rendered below.
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the 6-digit code sent to ${phone}. Code valid for 5 minutes.`}
    >
      <Controller
        control={control}
        name="otp"
        rules={{
          required: 'OTP is required',
          minLength: {
            value: 6,
            message: 'OTP must be 6 digits',
          },
          maxLength: {
            value: 6,
            message: 'OTP must be 6 digits',
          },
          validate: value => /^\d{6}$/.test(value) || 'OTP must contain digits only',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="OTP"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            placeholder="123456"
            error={error?.message}
          />
        )}
      />

      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Resend in: </Text>
        <Text style={styles.timerValue}>{formatSeconds(remainingSeconds)}</Text>
      </View>

      {otpError ? <Text style={styles.error}>{otpError}</Text> : null}

      <AppButton title="Verify OTP" onPress={handleSubmit(onVerify)} loading={verifyOtpLoading} />

      <AppButton
        title="Resend OTP"
        variant="secondary"
        onPress={onResend}
        disabled={remainingSeconds > 0}
        loading={sendOtpLoading}
        style={styles.resendButton}
      />

      <Pressable onPress={() => navigation.navigate('PhoneLogin', { prefillPhone: phone })}>
        <Text style={styles.link}>Edit phone number</Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timerLabel: {
    color: '#475569',
    fontSize: 14,
  },
  timerValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 10,
  },
  link: {
    marginTop: 14,
    color: '#0369A1',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  error: {
    color: '#DC2626',
    marginBottom: 10,
    fontSize: 13,
  },
});
