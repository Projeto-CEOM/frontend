import api from "./client";
import { USE_MOCK_AUTH } from "./config";
import { mockAuthApi } from "./mock";
import type { AuthSession, AuthUser, LoginPayload } from "./types";

const httpAuthApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthSession>("/api/auth/login", payload),
};

export const authApi = USE_MOCK_AUTH ? mockAuthApi : httpAuthApi;

export type { AuthSession, AuthUser, LoginPayload };
