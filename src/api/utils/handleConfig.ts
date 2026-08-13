import type { AxiosRequestConfig } from "axios";

/**
 * Mescla os headers padrão da API com os headers específicos da requisição.
 * O `Authorization` é injetado pelo interceptor em `src/api/client.ts`.
 */
export default function handleConfig(
  config: AxiosRequestConfig = {},
): AxiosRequestConfig {
  return {
    ...config,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    },
  };
}
