import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth';
import { themeReducer } from './theme';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
