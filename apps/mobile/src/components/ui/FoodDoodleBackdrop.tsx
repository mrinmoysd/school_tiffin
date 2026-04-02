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
  type:
    | 'apple'
    | 'bento'
    | 'broccoli'
    | 'carrot'
    | 'avocado'
    | 'watermelon'
    | 'banana'
    | 'peas'
    | 'cucumber'
    | 'spinach';
};

const DOODLES: Doodle[] = [
  { top: '8%', left: '8%', size: 46, rotate: '8deg', type: 'apple' },
  { top: '14%', right: '10%', size: 54, rotate: '-10deg', type: 'bento' },
  { top: '24%', left: '22%', size: 46, rotate: '-8deg', type: 'banana' },
  { top: '34%', right: '20%', size: 50, rotate: '12deg', type: 'broccoli' },
  { top: '45%', left: '10%', size: 44, rotate: '-6deg', type: 'peas' },
  { top: '56%', right: '12%', size: 42, rotate: '10deg', type: 'carrot' },
  { top: '66%', left: '24%', size: 52, rotate: '-9deg', type: 'avocado' },
  { top: '74%', right: '24%', size: 40, rotate: '6deg', type: 'cucumber' },
  { top: '84%', left: '12%', size: 44, rotate: '-7deg', type: 'spinach' },
  { top: '90%', right: '10%', size: 48, rotate: '7deg', type: 'watermelon' },
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

        if (doodle.type === 'apple') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.apple, sharedStyle]}>
              <View style={[styles.stem, { backgroundColor: borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'bento') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.bento, sharedStyle]}>
              <View
                style={[
                  styles.bentoDivider,
                  {
                    borderColor,
                  },
                ]}
              />
              <View style={[styles.bentoDot, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'broccoli') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.broccoli, sharedStyle]}>
              <View style={[styles.broccoliCrown, { borderColor }]} />
              <View style={[styles.broccoliStem, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'carrot') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.carrot, sharedStyle]}>
              <View style={[styles.carrotLeaf, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'banana') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.banana, sharedStyle]}>
              <View style={[styles.bananaCurve, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'peas') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.peas, sharedStyle]}>
              <View style={[styles.pea, { borderColor }]} />
              <View style={[styles.pea, { borderColor }]} />
              <View style={[styles.pea, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'avocado') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.avocado, sharedStyle]}>
              <View style={[styles.avocadoPit, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'cucumber') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.cucumber, sharedStyle]}>
              <View style={[styles.cucumberSeed, { borderColor }]} />
            </View>
          );
        }

        if (doodle.type === 'spinach') {
          return (
            <View key={`${doodle.top}-${index}`} style={[styles.spinach, sharedStyle]}>
              <View style={[styles.spinachVein, { borderColor }]} />
            </View>
          );
        }

        return (
          <View key={`${doodle.top}-${index}`} style={[styles.watermelon, sharedStyle]}>
            <View style={[styles.watermelonRind, { borderColor }]} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  apple: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  stem: {
    width: 3,
    height: 8,
    marginTop: -6,
    borderRadius: 2,
  },
  bento: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1.2,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bentoDivider: {
    width: '72%',
    borderTopWidth: 1.2,
  },
  bentoDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  broccoli: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  broccoliCrown: {
    width: '70%',
    height: '42%',
    borderRadius: 999,
    borderWidth: 1.2,
  },
  broccoliStem: {
    width: '22%',
    height: '20%',
    borderRadius: 4,
    borderWidth: 1.2,
    marginTop: 4,
  },
  carrot: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1.2,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  carrotLeaf: {
    width: '30%',
    height: '20%',
    borderRadius: 3,
    borderWidth: 1.2,
    marginTop: -4,
  },
  banana: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bananaCurve: {
    width: '70%',
    height: '48%',
    borderRadius: 999,
    borderWidth: 1.2,
  },
  peas: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1.2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pea: {
    width: 7,
    height: 7,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  avocado: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avocadoPit: {
    width: '28%',
    height: '28%',
    borderRadius: 999,
    borderWidth: 1.2,
  },
  cucumber: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cucumberSeed: {
    width: '36%',
    height: '36%',
    borderRadius: 999,
    borderWidth: 1.2,
  },
  spinach: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinachVein: {
    width: 2,
    height: '65%',
    borderRadius: 2,
    borderWidth: 1.2,
  },
  watermelon: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1.2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  watermelonRind: {
    width: '76%',
    borderTopWidth: 1.2,
    marginBottom: 6,
  },
});
