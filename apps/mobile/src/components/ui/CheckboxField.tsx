import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { themeColors } from '../../theme';

interface CheckboxFieldProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  error?: string;
}

export const CheckboxField = ({ label, value, onValueChange, error }: CheckboxFieldProps) => (
  <View style={styles.wrapper}>
    <Pressable onPress={() => onValueChange(!value)} style={styles.row}>
      <View style={[styles.box, value ? styles.boxChecked : undefined]}>
        {value ? <Text style={styles.tick}>?</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: themeColors.neutral.white,
  },
  boxChecked: {
    backgroundColor: themeColors.action.primary,
    borderColor: themeColors.action.primary,
  },
  tick: {
    color: themeColors.neutral.white,
    fontWeight: '700',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    color: themeColors.text.subtle,
    flex: 1,
  },
  error: {
    marginTop: 6,
    color: themeColors.intent.danger,
    fontSize: 12,
  },
});
