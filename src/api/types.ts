import type { Role } from "@/utils/permissions";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** Login completo, `usuario@tenant` — é daqui que sai o slug do tenant. */
  account?: string;
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
};

/**
 * Contrato CRUD compartilhado pelos helpers de domínio.
 *
 * A paginação é do servidor: `list` recebe os parâmetros e devolve o envelope
 * com `meta`. As demais operações trabalham com a entidade direto.
 */
export type CrudApi<TEntity, TPayload> = {
  list: (params?: ListParams) => Promise<Paginated<TEntity>>;
  get: (id: string) => Promise<TEntity>;
  create: (payload: TPayload) => Promise<TEntity>;
  update: (id: string, payload: TPayload) => Promise<TEntity>;
  remove: (id: string) => Promise<void>;
};

export type AlertFamily = "temperature" | "humidity" | "co2";

export type AlertLog = {
  id: string;
  roomId: string;
  roomName: string | null;
  sensorId: string | null;
  sensorIdentifier: string | null;
  alertType: string | null;
  value: number | null;
  message: string | null;
  triggeredAt: string;
};

export type AlertListParams = ListParams & {
  roomId?: string;
  sensorId?: string;
  type?: AlertFamily;
  alertType?: string;
  from?: string;
  to?: string;
};

/** Leitura bruta enviada pelo ESP32 — valores podem faltar (envio parcial). */
export type SensorReading = {
  id: string;
  sensorId: string;
  sensorIdentifier: string | null;
  roomId: string | null;
  roomName: string | null;
  tempValue: number | null;
  humValue: number | null;
  co2Value: number | null;
  recordedAt: string;
};

export type ReadingListParams = ListParams & {
  sensorId?: string;
  roomId?: string;
  from?: string;
  to?: string;
};

export type Channel = {
  id: string;
  telegramId: string;
  name: string | null;
  rooms: { id: string; name: string }[];
};

export type ChannelPayload = {
  telegramId: string;
  name?: string;
};

/** Usuário do tenant — espelha o `serialize()` de `UserController.js`. */
export type User = {
  id: string;
  tenantId: string;
  /** Login completo, já com o sufixo `@tenant`. */
  account: string;
  name: string;
  email: string | null;
  /** Máscara própria do backend; o front deriva as permissões do `role`. */
  permissions: number | null;
  role: Role;
  createdAt?: string;
};

export type UserPayload = {
  /**
   * Só a parte local — o backend acrescenta o `@tenant` da sessão. Ausente na
   * edição: o login não muda depois de criado.
   */
  account?: string;
  name: string;
  email?: string | null;
  role: Role;
  /** Obrigatória no cadastro; na edição, só quando for trocar. */
  password?: string;
};

export type UserListParams = ListParams & {
  role?: Role;
  q?: string;
};
