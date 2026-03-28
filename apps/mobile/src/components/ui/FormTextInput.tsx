import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '../../theme';

interface FormTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const FormTextInput = ({ label, error, ...props }: FormTextInputProps) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.neutral.slate400}
        style={[styles.input, error ? styles.inputError : undefined]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 14,
    },
    label: {
      marginBottom: 6,
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      borderRadius: 12,
      paddingHorizontal: 12,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.neutral.white,
    },
    inputError: {
      borderColor: colors.intent.danger,
    },
    error: {
      marginTop: 6,
      color: colors.intent.danger,
      fontSize: 12,
    },
  });
