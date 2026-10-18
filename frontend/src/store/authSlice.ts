import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, BuyerProfile, User } from '../types';

const initialState: AuthState = {
  user: null,
  buyerProfile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; buyerProfile?: BuyerProfile }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.buyerProfile = action.payload.buyerProfile || null;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.buyerProfile = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.buyerProfile = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    updateBuyerProfile: (state, action: PayloadAction<BuyerProfile>) => {
      state.buyerProfile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateBuyerProfile,
  clearError,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;