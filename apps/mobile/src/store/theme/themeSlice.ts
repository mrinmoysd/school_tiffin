import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { type ThemePreference } from '../../theme/themeCore';

interface ThemeState {
  preference: ThemePreference;
}

const initialState: ThemeState = {
  preference: 'system',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemePreference: (state, action: PayloadAction<ThemePreference>) => {
      state.preference = action.payload;
    },
  },
});

export const { setThemePreference } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
