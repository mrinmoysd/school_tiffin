import { AppThemeColors, darkThemeColors, lightThemeColors } from './colors';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const resolveThemePreference = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme => {
  if (preference === 'system') {
    return systemTheme;
  }

  return preference;
};

export const getThemeColors = (theme: ResolvedTheme): AppThemeColors =>
  theme === 'dark' ? darkThemeColors : lightThemeColors;
