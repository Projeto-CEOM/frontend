import api from "./client";
import type { Paginated, User, UserListParams, UserPayload } from "./types";

const COLLECTION = "/api/users/";
const item = (id: string) => `/api/users/${id}`;

/**
 * O formulário e a API divergem em dois pontos, e a tradução fica isolada aqui
 * (mesmo padrão de `sensors.ts`):
 *
 * - `telegramUser` vazio vai como `null`, para o backend não gravar string
 *   vazia num campo que é opcional;
 * - `password` em branco na edição significa "manter a atual" — mandar `""`
 *   levaria o 400 de senha curta.
 *
 * `account` é ignorado pelo `update` do backend: o login não muda depois de
 * criado.
 */
const toRequestBody = (payload: UserPayload, isUpdate: boolean) => {
  const body: Record<string, unknown> = {
    name: payload.name,
    role: payload.role,
    // Aqui trocamos para phone e removemos tudo que não for número (máscara)
    phone: payload.phone?.trim() ? payload.phone : null,
  };

  if (!isUpdate) body.account = payload.account?.trim().toLowerCase() ?? "";
  if (payload.password?.trim()) body.password = payload.password;

  return body;
};
export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<Paginated<User>>(COLLECTION, { params }),
  get: (id: string) => api.get<User>(item(id)),
  create: (payload: UserPayload) =>
    api.post<User>(COLLECTION, toRequestBody(payload, false)),
  update: (id: string, payload: UserPayload) =>
    api.put<User>(item(id), toRequestBody(payload, true)),
  remove: (id: string) => api.del<void>(item(id)).then(() => undefined),
};

export type { User, UserPayload, UserListParams };
