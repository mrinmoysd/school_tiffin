import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { themeColors } from '../../theme';

interface FormTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const FormTextInput = ({ label, error, ...props }: FormTextInputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={themeColors.neutral.slate400}
      style={[styles.input, error ? styles.inputError : undefined]}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate300,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: themeColors.text.primary,
    backgroundColor: themeColors.neutral.white,
  },
  inputError: {
    borderColor: themeColors.intent.danger,
  },
  error: {
    marginTop: 6,
    color: themeColors.intent.danger,
    fontSize: 12,
  },
});
