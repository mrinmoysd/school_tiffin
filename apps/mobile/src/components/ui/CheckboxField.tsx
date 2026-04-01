import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';

interface CheckboxFieldProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  error?: string;
}

export const CheckboxField = ({ label, value, onValueChange, error }: CheckboxFieldProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
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
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
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
      borderColor: colors.neutral.slate400,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      backgroundColor: colors.neutral.white,
    },
    boxChecked: {
      backgroundColor: colors.action.primary,
      borderColor: colors.action.primary,
    },
    tick: {
      color: colors.neutral.white,
      fontWeight: '700',
      lineHeight: 16,
    },
    label: {
      fontSize: 14,
      color: colors.text.subtle,
      flex: 1,
    },
    error: {
      marginTop: 6,
      color: colors.intent.danger,
      fontSize: 12,
    },
  });
