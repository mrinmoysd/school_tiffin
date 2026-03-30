import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { AppNavigator } from './src/navigation';
import { bootstrapAuth, logout } from './src/store/auth';
import { useAppDispatch } from './src/store/hooks';
import { store } from './src/store';
import { setUnauthorizedHandler } from './src/api/client/apiClient';
import { useAppTheme } from './src/theme';

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
    if (Platform.OS !== 'android' || Constants.executionEnvironment === 'storeClient') {
      return;
    }

    const applyAndroidNavigationBarTheme = async () => {
      try {
        const NavigationBar = await import('expo-navigation-bar');
        await NavigationBar.setBackgroundColorAsync(colors.neutral.white);
        await NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
        await NavigationBar.setBorderColorAsync(colors.neutral.slate200);
      } catch {
        // Native module may be unavailable until the Android app is rebuilt.
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
