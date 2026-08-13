export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:6767";

const flag = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value === "true";

/** Override geral: liga/desliga o mock de todos os recursos de uma vez. */
const MOCK_ALL = import.meta.env.VITE_USE_MOCK_API;

/**
 * Mock por recurso — o padrão acompanha o que o backend já expõe hoje:
 * `/api/rooms/` existe, `/api/sensors/` e `/api/auth/login` ainda não.
 * Cada flag aceita `true`/`false` no `.env` e vence o override geral.
 */
export const USE_MOCK_ROOMS = flag(
  import.meta.env.VITE_USE_MOCK_ROOMS ?? MOCK_ALL,
  false,
);

export const USE_MOCK_SENSORS = flag(
  import.meta.env.VITE_USE_MOCK_SENSORS ?? MOCK_ALL,
  true,
);

export const USE_MOCK_AUTH = flag(
  import.meta.env.VITE_USE_MOCK_AUTH ?? MOCK_ALL,
  true,
);
