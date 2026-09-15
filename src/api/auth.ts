import api from "./client";
import type { AuthSession, AuthUser, LoginPayload } from "./types";

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthSession>("/api/auth/login", payload),

  me: () => api.get<AuthUser>("/api/auth/me"),
};

export type { AuthSession, AuthUser, LoginPayload };
