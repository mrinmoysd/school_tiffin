import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AuthLayout, FormTextInput } from '../../components/ui';
import { INDIAN_PHONE_REGEX } from '../../constants/validation';
import { clearAuthErrors, sendOtp } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../navigation/types';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneLogin'>;

interface PhoneLoginFormValues {
  phone: string;
}

export const PhoneLoginScreen = ({ route, navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { sendOtpLoading, otpError } = useAppSelector(state => state.auth);

  const prefilledPhone = useMemo(() => {
    const raw = route.params?.prefillPhone ?? '';
    return raw.startsWith('+91') ? raw.slice(3) : raw;
  }, [route.params?.prefillPhone]);

  const { control, handleSubmit, setValue } = useForm<PhoneLoginFormValues>({
    defaultValues: {
      phone: prefilledPhone,
    },
  });

  useEffect(() => {
    setValue('phone', prefilledPhone);
  }, [prefilledPhone, setValue]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [dispatch]);

  const onSubmit = async (values: PhoneLoginFormValues) => {
    const phoneWithCode = `+91${values.phone.trim()}`;

    const result = await dispatch(sendOtp({ phone: phoneWithCode })).unwrap();

    navigation.navigate('OtpVerification', {
      phone: phoneWithCode,
      expiresIn: result.expiresIn,
    });
  };

  return (
    <AuthLayout title="Phone Login" subtitle="Enter your mobile number to receive OTP.">
      <Controller
        control={control}
        name="phone"
        rules={{
          required: 'Phone number is required',
          validate: value =>
            INDIAN_PHONE_REGEX.test(value.trim()) || 'Enter a valid 10-digit number',
        }}
        render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
          <FormTextInput
            label="Phone Number"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            autoFocus
            maxLength={10}
            placeholder="9876543210"
            error={error?.message}
          />
        )}
      />

      <Text style={styles.codeHint}>Country code: +91</Text>

      {otpError ? <Text style={styles.error}>{otpError}</Text> : null}

      <AppButton title="Send OTP" onPress={handleSubmit(onSubmit)} loading={sendOtpLoading} />

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Switch to email login</Text>
      </Pressable>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  codeHint: {
    fontSize: 13,
    color: themeColors.text.secondary,
    marginTop: -8,
    marginBottom: 12,
  },
  error: {
    color: themeColors.intent.danger,
    marginBottom: 10,
    fontSize: 13,
  },
  link: {
    marginTop: 14,
    color: themeColors.intent.infoStrong,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
