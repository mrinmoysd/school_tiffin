import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { getThemeColors, resolveThemePreference, ResolvedTheme } from './index';

export const useAppTheme = () => {
  const preference = useAppSelector(state => state.theme.preference);
  const systemColorScheme = useColorScheme();

  const systemTheme: ResolvedTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  const resolvedTheme = resolveThemePreference(preference, systemTheme);
  const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme]);

  return {
    preference,
    resolvedTheme,
    colors,
  };
};
