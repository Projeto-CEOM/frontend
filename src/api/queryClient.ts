import { MutationCache, QueryClient } from "@tanstack/react-query";
import { store } from "@/store";
import { toastPushed } from "@/store/slices/toastSlice";
import { ApiError } from "./client";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Toast disparado quando a mutation confirma. */
      successMessage?: string;
      /** Sobrescreve a mensagem de erro padrão do `ApiError`. */
      errorMessage?: string;
      /** Para telas que já exibem o erro inline (ex.: login). */
      silentError?: boolean;
    };
  }
}

/**
 * Feedback global das mutations: sucesso vem do `meta.successMessage` e o erro
 * usa a mensagem já traduzida do `ApiError`. O rollback otimista fica no
 * `onError` de cada hook (`createCrudQueries`).
 */
const mutationCache = new MutationCache({
  onSuccess: (_data, _variables, _context, mutation) => {
    const message = mutation.meta?.successMessage;
    if (message) {
      store.dispatch(toastPushed(message, "success"));
    }
  },
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.silentError) return;

    const message =
      mutation.meta?.errorMessage ??
      (error instanceof ApiError
        ? error.message
        : "Não foi possível concluir a operação.");

    store.dispatch(toastPushed(message, "error"));
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Erros de autenticação/validação não melhoram com retry.
      retry: (failureCount, error) => {
        const status = error instanceof ApiError ? error.status : undefined;
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
