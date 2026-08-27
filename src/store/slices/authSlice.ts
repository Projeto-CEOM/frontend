import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession, AuthUser } from "@/api/auth";
import { maskForRole, normalizeRole } from "@/utils/permissions";

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
    sessionUserUpdated: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
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
    /** Papel da sessão; papel desconhecido cai no `DEFAULT_ROLE`. */
    selectRole: (state) => (state.user ? normalizeRole(state.user.role) : null),
    /** Máscara de bits derivada do papel — 0 quando não há sessão. */
    selectPermissionMask: (state) =>
      state.user ? maskForRole(state.user.role) : 0,
  },
});

export const { sessionStarted, sessionUserUpdated, sessionEnded } =
  authSlice.actions;
export const {
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectRole,
  selectPermissionMask,
} = authSlice.selectors;

export default authSlice.reducer;
