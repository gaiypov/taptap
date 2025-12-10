import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  is_verified?: boolean;
  last_seen?: string;
  free_limit?: number;
  paid_slots?: number;
}

interface SellerInfo {
  phone_for_listings?: string;
  response_time_hours?: number;
  total_sales?: number;
  rating?: number;
  reviews_count?: number;
  active_listings_count?: number;
  total_listings_count?: number;
}

interface AuthState {
  user: User | null;
  sellerInfo: SellerInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean; // Persisted flag for first launch detection
}

const initialState: AuthState = {
  user: null,
  sellerInfo: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║       🔐 REDUX setCredentials CALLED 🔐                      ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║ STEP 2.5: Redux State Update                                 ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');

      console.log('[DEBUG] BEFORE update:');
      console.log('[DEBUG]   state.isAuthenticated:', state.isAuthenticated);
      console.log('[DEBUG]   state.user?.id:', state.user?.id);
      console.log('[DEBUG]   state.hasToken:', !!state.token);

      console.log('');
      console.log('[DEBUG] PAYLOAD received:');
      console.log('[DEBUG]   user.id:', action.payload.user?.id);
      console.log('[DEBUG]   user.phone:', action.payload.user?.phone);
      console.log('[DEBUG]   user.name:', action.payload.user?.name);
      console.log('[DEBUG]   token.length:', action.payload.token?.length);

      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;

      console.log('');
      console.log('[DEBUG] AFTER update:');
      console.log('[DEBUG]   state.isAuthenticated:', state.isAuthenticated);
      console.log('[DEBUG]   state.user.id:', state.user?.id);
      console.log('[DEBUG]   state.user.phone:', state.user?.phone);
      console.log('[DEBUG]   state.user.name:', state.user?.name);
      console.log('[DEBUG]   state.hasToken:', !!state.token);

      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║ ✅ REDUX STATE UPDATED SUCCESSFULLY                          ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('');
    },
    logout(state) {
      console.log('[Redux] logout called');
      state.user = null;
      state.sellerInfo = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setSellerInfo(state, action: PayloadAction<SellerInfo | null>) {
      console.log('[Redux] setSellerInfo called', action.payload);
      state.sellerInfo = action.payload;
    },
    updateSellerInfo(state, action: PayloadAction<Partial<SellerInfo>>) {
      console.log('[Redux] updateSellerInfo called', action.payload);
      if (state.sellerInfo) {
        state.sellerInfo = { ...state.sellerInfo, ...action.payload };
      } else {
        state.sellerInfo = action.payload as SellerInfo;
      }
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      console.log('[Redux] updateUser called', action.payload);
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    // Для загрузки auth state из storage при старте приложения
    hydrateAuth(state, action: PayloadAction<{ user: User; token: string; hasSeenOnboarding?: boolean }>) {
      console.log('[Redux] hydrateAuth called', {
        userId: action.payload.user?.id,
        hasToken: !!action.payload.token,
        hasSeenOnboarding: action.payload.hasSeenOnboarding,
      });
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (action.payload.hasSeenOnboarding !== undefined) {
        state.hasSeenOnboarding = action.payload.hasSeenOnboarding;
      }
      console.log('[Redux] ✅ Auth state hydrated');
    },
    // Mark onboarding as seen (persisted to AsyncStorage separately)
    setHasSeenOnboarding(state, action: PayloadAction<boolean>) {
      console.log('[Redux] setHasSeenOnboarding called', { value: action.payload });
      state.hasSeenOnboarding = action.payload;
    },
  },
});

export const { setCredentials, logout, updateUser, setLoading, hydrateAuth, setHasSeenOnboarding, setSellerInfo, updateSellerInfo } = authSlice.actions;

// Types export
export type { User, SellerInfo, AuthState };

export default authSlice.reducer;
