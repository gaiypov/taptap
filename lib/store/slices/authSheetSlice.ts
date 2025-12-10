import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/lib/store';
import type { AuthAction } from '@/utils/permissionManager';

interface AuthSheetState {
  isOpen: boolean;
  action: AuthAction | null;
}

const initialState: AuthSheetState = {
  isOpen: false,
  action: null,
};

const authSheetSlice = createSlice({
  name: 'authSheet',
  initialState,
  reducers: {
    open: (state, action: PayloadAction<AuthAction>) => {
      console.log('[AUTH SHEET] Opening for action:', action.payload);
      state.isOpen = true;
      state.action = action.payload;
    },
    close: (state) => {
      console.log('[AUTH SHEET] Closing');
      state.isOpen = false;
      state.action = null;
    },
  },
});

export const { open, close } = authSheetSlice.actions;

// Selectors
export const selectAuthSheet = (state: RootState) => state.authSheet;
export const selectIsAuthSheetOpen = (state: RootState) => state.authSheet.isOpen;
export const selectAuthSheetAction = (state: RootState) => state.authSheet.action;

export default authSheetSlice.reducer;

