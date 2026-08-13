import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession, AuthUser } from "@/api/auth";

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    sessionEnded: (state) => {
      state.user = null;
      state.token = null;
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectToken: (state) => state.token,
    selectIsAuthenticated: (state) => Boolean(state.user && state.token),
  },
});

export const { sessionStarted, sessionEnded } = authSlice.actions;
export const { selectUser, selectToken, selectIsAuthenticated } =
  authSlice.selectors;

export default authSlice.reducer;
