import type { ListParams } from "./types";

/**
 * Chaves de cache do react-query. Centralizadas para que invalidações e
 * prefetch usem sempre a mesma referência.
 *
 * `lists()` é o prefixo de TODAS as páginas de uma listagem — use em filtros
 * (`invalidateQueries`, `setQueriesData`); `list(params)` é a página concreta.
 */
export const queryKeys = {
  rooms: {
    all: ["rooms"] as const,
    lists: () => [...queryKeys.rooms.all, "list"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.rooms.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.rooms.all, "detail", id] as const,
  },
  sensors: {
    all: ["sensors"] as const,
    lists: () => [...queryKeys.sensors.all, "list"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.sensors.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.sensors.all, "detail", id] as const,
  },
  channels: {
    all: ["channels"] as const,
    lists: () => [...queryKeys.channels.all, "list"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.channels.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.channels.all, "detail", id] as const,
  },
};