import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setThemePreference } from '../store/theme';
import { type AppThemeColors } from './colors';
import {
  getThemeColors,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from './themeCore';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: AppThemeColors;
  setPreference: (nextPreference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const preference = useAppSelector(state => state.theme.preference);
  const systemColorScheme = useColorScheme();

  const systemTheme: ResolvedTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  const resolvedTheme = resolveThemePreference(preference, systemTheme);
  const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme]);

  const setPreference = useCallback(
    (nextPreference: ThemePreference) => {
      dispatch(setThemePreference(nextPreference));
    },
    [dispatch],
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      colors,
      setPreference,
    }),
    [colors, preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
