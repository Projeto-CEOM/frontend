import { useMutation } from "@tanstack/react-query";
import { authApi, type LoginPayload } from "../auth";

/**
 * Mutation pura de login: apenas fala com a API. A gravação da sessão na
 * store fica em `src/hooks/UseAuth`. O erro é exibido inline no formulário,
 * por isso não dispara toast.
 */
export const useLogin = () =>
  useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    meta: { silentError: true },
  });
