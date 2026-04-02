import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';

type Percent = `${number}%`;

type Doodle = {
  top: Percent;
  left?: Percent;
  right?: Percent;
  size: number;
  rotate: `${number}deg`;
  type: 'circle' | 'pill' | 'bowl';
};

const DOODLES: Doodle[] = [
  { top: '6%', left: '6%', size: 44, rotate: '8deg', type: 'circle' },
  { top: '12%', right: '10%', size: 52, rotate: '-10deg', type: 'bowl' },
  { top: '22%', left: '18%', size: 46, rotate: '-12deg', type: 'pill' },
  { top: '30%', right: '20%', size: 48, rotate: '10deg', type: 'circle' },
  { top: '42%', left: '8%', size: 58, rotate: '-8deg', type: 'bowl' },
  { top: '54%', right: '12%', size: 40, rotate: '14deg', type: 'pill' },
  { top: '66%', left: '22%', size: 44, rotate: '-10deg', type: 'circle' },
  { top: '78%', right: '8%', size: 50, rotate: '7deg', type: 'bowl' },
  { top: '86%', left: '12%', size: 38, rotate: '-6deg', type: 'pill' },
];

export const FoodDoodleBackdrop = () => {
  const { colors, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const palette = useMemo(
    () =>
      isDark
        ? [colors.neutral.slate300, colors.neutral.slate400, colors.neutral.slate300]
        : [colors.surface.warningSoft, colors.surface.infoSoft, colors.surface.successSubtle],
    [colors, isDark],
  );

  return (
    <View pointerEvents="none" style={[styles.container, { opacity: isDark ? 0.75 : 0.5 }]}>
      {DOODLES.map((doodle, index) => {
        const color = palette[index % palette.length];
        const borderColor = isDark ? colors.neutral.slate200 : colors.neutral.slate200;
        const sharedStyle: ViewStyle = {
          top: doodle.top,
          left: doodle.left,
          right: doodle.right,
          width: doodle.size,
          height: doodle.size,
          transform: [{ rotate: doodle.rotate }],
          borderColor,
          borderWidth: isDark ? 2 : 1,
          backgroundColor: isDark ? 'transparent' : color,
        };

        if (doodle.type === 'pill') {
          return <View key={`${doodle.top}-${index}`} style={[styles.pill, sharedStyle]} />;
        }

        if (doodle.type === 'bowl') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.bowl, sharedStyle]}>
              <View
                style={[
                  styles.bowlInner,
                  {
                    borderColor,
                    backgroundColor: isDark ? 'transparent' : colors.neutral.white,
                  },
                ]}
              />
            </View>
          );
        }

        return <View key={`${doodle.top}-${index}`} style={[styles.circle, sharedStyle]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  pill: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    width: 56,
    height: 30,
  },
  bowl: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  bowlInner: {
    width: '100%',
    height: '60%',
    borderRadius: 999,
    borderWidth: 1,
  },
});
