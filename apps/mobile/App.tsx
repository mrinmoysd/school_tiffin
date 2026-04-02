import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo';
import { AppNavigator } from './src/navigation';
import { bootstrapAuth, logout } from './src/store/auth';
import { useAppDispatch } from './src/store/hooks';
import { store } from './src/store';
import { setUnauthorizedHandler } from './src/api/client/apiClient';
import { ThemeProvider, useAppTheme } from './src/theme';
import { AppAlertProvider } from './src/components/ui';

type NavigationBarModule = {
  setButtonStyleAsync: (style: 'light' | 'dark') => Promise<void>;
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

        await NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
      } catch {
        // Ignore if this native module isn't available in the current runtime.
      }
    };

    void applyAndroidNavigationBarTheme();
  }, [resolvedTheme]);

  return (
    <SafeAreaProvider>
      <View style={[styles.appRoot, { backgroundColor: colors.neutral.white }]}>
        <StatusBar
          barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.neutral.white}
          translucent={false}
        />
        <BootstrapAuthState />
      </View>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <AppAlertProvider>
            <AppShell />
          </AppAlertProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
});
