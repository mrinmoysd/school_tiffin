import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';

type AppLoaderProps = {
  label?: string;
  compact?: boolean;
};

export const AppLoader = ({
  label = 'Preparing your meal...',
  compact = false,
}: AppLoaderProps) => {
  const { colors } = useAppTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    floatLoop.start();
    spinLoop.start();

    return () => {
      floatLoop.stop();
      spinLoop.stop();
    };
  }, [floatAnim, spinAnim]);

  const bobbing = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
  };

  const spinning = {
    transform: [
      {
        rotate: spinAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Animated.View style={[styles.plateWrap, bobbing]}>
        <View style={[styles.plate, { borderColor: colors.neutral.slate300 }]}>
          <Animated.View
            style={[styles.food, spinning, { backgroundColor: colors.action.primary }]}
          />
        </View>
      </Animated.View>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  compactContainer: {
    minHeight: 160,
    flex: 0,
  },
  plateWrap: {
    marginBottom: 12,
  },
  plate: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  food: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
