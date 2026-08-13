import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin } from "@/api/queries/useLogin";
import type { LoginPayload } from "@/api/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsAuthenticated,
  selectUser,
  sessionEnded,
  sessionStarted,
} from "@/store/slices/authSlice";

/**
 * Ponte entre a mutation de login (react-query) e a sessão (redux).
 * Substitui o antigo `AuthContext`.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loginMutation = useLogin();

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await loginMutation.mutateAsync(payload);
      dispatch(sessionStarted(session));
      return session;
    },
    [dispatch, loginMutation],
  );

  const logout = useCallback(() => {
    dispatch(sessionEnded());
    // Nenhum dado do usuário anterior deve sobreviver no cache.
    queryClient.clear();
  }, [dispatch, queryClient]);

  return {
    user,
    isAuthenticated,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
};
