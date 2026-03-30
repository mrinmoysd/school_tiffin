import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo';
import { AppNavigator } from './src/navigation';
import { bootstrapAuth, logout } from './src/store/auth';
import { useAppDispatch } from './src/store/hooks';
import { store } from './src/store';
import { setUnauthorizedHandler } from './src/api/client/apiClient';
import { useAppTheme } from './src/theme';

type NavigationBarModule = {
  setBackgroundColorAsync: (color: string) => Promise<void>;
  setButtonStyleAsync: (style: 'light' | 'dark') => Promise<void>;
  setBorderColorAsync: (color: string) => Promise<void>;
};

const BootstrapAuthState = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapAuth());
    setUnauthorizedHandler(() => {
      void dispatch(logout());
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [dispatch]);

  return <AppNavigator />;
};

const AppShell = () => {
  const { resolvedTheme, colors } = useAppTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const applyAndroidNavigationBarTheme = async () => {
      try {
        const NavigationBar = requireOptionalNativeModule<NavigationBarModule>('ExpoNavigationBar');

        if (!NavigationBar) {
          if (__DEV__) {
            console.warn('ExpoNavigationBar native module is unavailable in this runtime.');
          }
          return;
        }

        await NavigationBar.setBackgroundColorAsync(colors.neutral.white);
        await NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
        await NavigationBar.setBorderColorAsync(colors.neutral.slate200);
      } catch {
        // Ignore if this native module isn't available in the current runtime.
      }
    };

    void applyAndroidNavigationBarTheme();
  }, [colors.neutral.slate200, colors.neutral.white, resolvedTheme]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.neutral.white}
        translucent={false}
      />
      <BootstrapAuthState />
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppShell />
      </Provider>
    </GestureHandlerRootView>
  );
}
