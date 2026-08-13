/**
 * Chaves de cache do react-query. Centralizadas para que invalidações e
 * prefetch usem sempre a mesma referência.
 */
export const queryKeys = {
  rooms: {
    all: ["rooms"] as const,
    list: () => [...queryKeys.rooms.all, "list"] as const,
    detail: (id: string) => [...queryKeys.rooms.all, "detail", id] as const,
  },
  sensors: {
    all: ["sensors"] as const,
    list: () => [...queryKeys.sensors.all, "list"] as const,
    detail: (id: string) => [...queryKeys.sensors.all, "detail", id] as const,
  },
};
