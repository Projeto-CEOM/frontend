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

export type Reading = {
  id: string;
  tempValue: number;
  humValue: number;
  co2Value?: number;
  sensorIdentifier: string;
  roomName: string;
  recordedAt?: string;
};

export type SortOrder = "asc" | "desc";

/** Bloco `meta` que a API devolve junto de toda listagem. */
export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: SortOrder;
};

/** Envelope das listagens: `{ data, meta }`. */
export type Paginated<TEntity> = {
  data: TEntity[];
  meta: ListMeta;
};

/** Query string aceita pelas listagens. */
export type ListParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: { [k: string]: string };
};

/**
 * Contrato CRUD compartilhado pelos helpers de domínio.
 *
 * A paginação é do servidor: `list` recebe os parâmetros e devolve o envelope
 * com `meta`. As demais operações trabalham com a entidade direto.
 */
export type CrudApi<TEntity, TPayload> = {
  list?: (params?: ListParams) => Promise<Paginated<TEntity>>;
  get?: (id: string) => Promise<TEntity>;
  create?: (payload: TPayload) => Promise<TEntity>;
  update?: (id: string, payload: TPayload) => Promise<TEntity>;
  remove?: (id: string) => Promise<void>;
};
