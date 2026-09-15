import type {
  AlertListParams,
  ListParams,
  ReadingSummaryParams,
  UserListParams,
} from "./types";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
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
  alerts: {
    all: ["alerts"] as const,
    lists: () => [...queryKeys.alerts.all, "list"] as const,
    list: (params?: AlertListParams) =>
      [...queryKeys.alerts.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.alerts.all, "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: UserListParams) =>
      [...queryKeys.users.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  readings: {
    all: ["readings"] as const,
    lists: () => [...queryKeys.readings.all, "list"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.readings.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.readings.all, "detail", id] as const,
    summary: (params?: ReadingSummaryParams) =>
      [...queryKeys.readings.all, "summary", params ?? {}] as const,
  },
};
