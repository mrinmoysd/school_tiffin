import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { bootstrapAuth } from './src/store/auth';
import { useAppDispatch } from './src/store/hooks';
import { store } from './src/store';

const BootstrapAuthState = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapAuth());
  }, [dispatch]);

  return <AppNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <BootstrapAuthState />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
