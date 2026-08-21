import type { Role } from "@/utils/permissions";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** Define a máscara de permissões da sessão (ver `@/utils/permissions`). */
  role?: Role;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

export type LoginPayload = {
  account: string;
  password: string;
  rememberMe?: boolean;
};

/** Faixas que disparam alerta. */
export type EnvironmentLimits = {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
};

export type RoomPayload = {
  name: string;
  description: string;
} & EnvironmentLimits;

/**
 * O backend atual devolve apenas `id`, `name`, `description` e `createdAt` —
 * as faixas são opcionais na leitura até que sejam persistidas lá.
 */
export type Room = {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
} & Partial<EnvironmentLimits>;

export type SensorPayload = {
  identifier: string;
  roomId: string;
} & EnvironmentLimits;

export type Sensor = {
  id: string;
  identifier: string;
  roomId: string;
  createdAt?: string;
} & Partial<EnvironmentLimits>;

/** Contrato CRUD compartilhado pelos helpers de domínio. */
export type CrudApi<TEntity, TPayload> = {
  list: () => Promise<TEntity[]>;
  get: (id: string) => Promise<TEntity>;
  create: (payload: TPayload) => Promise<TEntity>;
  update: (id: string, payload: TPayload) => Promise<TEntity>;
  remove: (id: string) => Promise<void>;
};
