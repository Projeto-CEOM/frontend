import api from "./client";
import type { CrudApi, Room, RoomPayload } from "./types";

// A coleção mantém a barra final (`POST /api/rooms/`); os itens seguem sem ela
// (`PUT /api/rooms/{id}`).
const COLLECTION = "/api/rooms/";
const item = (id: string) => `/api/rooms/${id}`;

export const roomsApi: CrudApi<Room, RoomPayload> = {
  list: () => api.get<Room[]>(COLLECTION),
  get: (id) => api.get<Room>(item(id)),
  create: (payload) => api.post<Room>(COLLECTION, payload),
  update: (id, payload) => api.put<Room>(item(id), payload),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export type { Room, RoomPayload };
