import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./config";
import handleConfig from "./utils/handleConfig";

const instance = axios.create({ baseURL: API_BASE_URL });

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Chamado pela store sempre que a sessão muda (login, logout, reidratação). */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Permite que a store encerre a sessão quando a API responder 401. */
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Requisição inválida. Revise os dados enviados.",
  401: "Sessão expirada. Entre novamente para continuar.",
  403: "Você não tem permissão para executar esta ação.",
  404: "Registro não encontrado.",
  409: "Já existe um registro com estes dados.",
  422: "Não foi possível validar os dados enviados.",
};

const toApiError = (error: AxiosError<{ message?: string }>) => {
  const status = error.response?.status;

  if (!error.response) {
    return new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
    );
  }

  const fallback =
    status !== undefined && status >= 500
      ? "Erro interno no servidor. Tente novamente em instantes."
      : "Não foi possível concluir a operação.";

  const message =
    error.response.data?.message ??
    (status !== undefined ? STATUS_MESSAGES[status] : undefined) ??
    fallback;

  return new ApiError(message, status, error.response.data);
};

instance.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(toApiError(error));
  },
);

/**
 * Único ponto de saída HTTP da aplicação: páginas, hooks e componentes nunca
 * importam axios diretamente, apenas os helpers de domínio de `src/api`.
 */
const api = {
  get: <T>(path: string, config?: AxiosRequestConfig) =>
    instance.get<T>(path, handleConfig(config)).then(({ data }) => data),

  post: <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<T>(path, data, handleConfig(config)).then((res) => res.data),

  put: <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.put<T>(path, data, handleConfig(config)).then((res) => res.data),

  patch: <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.patch<T>(path, data, handleConfig(config)).then((res) => res.data),

  del: <T>(path: string, config?: AxiosRequestConfig) =>
    instance.delete<T>(path, handleConfig(config)).then(({ data }) => data),
};

export default api;
