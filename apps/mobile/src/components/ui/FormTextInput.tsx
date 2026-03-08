import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface FormTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const FormTextInput = ({ label, error, ...props }: FormTextInputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor="#94A3B8"
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
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  error: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 12,
  },
});
