import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUserType } from 'shared-ts';
import { fetchCurrentUser, logout as logoutRequest } from '../services/auth';

/**
 * Login state (D-063). `checking`: GET /auth/me at startup, nothing of the register is shown
 * yet. `notice: 'expired'`: the session ended during use (answer 7 a), said on the login screen.
 * The cart is never touched here: it stays on the device (point 5, D-019, D-025).
 */
export interface AuthState {
  status: 'checking' | 'anonymous' | 'authenticated';
  user: AuthUserType | null;
  notice: 'expired' | null;
}

const initialState: AuthState = { status: 'checking', user: null, notice: null };

/** Startup: is there an open session? A network error shows the login screen. */
export const checkSession = createAsyncThunk('auth/checkSession', async () => {
  try {
    return await fetchCurrentUser();
  } catch {
    return null;
  }
});

/** "Se déconnecter" (answer 8 a): no confirmation, the cart stays on the device. */
export const logOut = createAsyncThunk('auth/logOut', async () => {
  await logoutRequest();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn: (state, action: PayloadAction<AuthUserType>) => {
      state.status = 'authenticated';
      state.user = action.payload;
      state.notice = null;
    },
    /** A request got 401 while logged in (expired, revoked, account disabled). */
    sessionExpired: (state) => {
      if (state.status !== 'authenticated') return;
      state.status = 'anonymous';
      state.user = null;
      state.notice = 'expired';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.fulfilled, (state, action) => {
        state.status = action.payload ? 'authenticated' : 'anonymous';
        state.user = action.payload;
      })
      .addCase(logOut.pending, (state) => {
        state.status = 'anonymous';
        state.user = null;
        state.notice = null;
      });
  },
});

export const { loggedIn, sessionExpired } = authSlice.actions;
export const authReducer = authSlice.reducer;

type WithAuth = { auth: AuthState };
export const selectAuthStatus = (state: WithAuth) => state.auth.status;
export const selectAuthUser = (state: WithAuth) => state.auth.user;
export const selectAuthNotice = (state: WithAuth) => state.auth.notice;
