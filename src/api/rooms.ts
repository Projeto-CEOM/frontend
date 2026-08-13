import api from "./client";
import { USE_MOCK_ROOMS } from "./config";
import { mockRoomsApi } from "./mock";
import type { CrudApi, Room, RoomPayload } from "./types";

// A coleção mantém a barra final usada pela integração anterior
// (`POST /api/rooms/`); os itens seguem sem ela (`PUT /api/rooms/{id}`).
const COLLECTION = "/api/rooms/";
const item = (id: string) => `/api/rooms/${id}`;

const httpRoomsApi: CrudApi<Room, RoomPayload> = {
  list: () => api.get<Room[]>(COLLECTION),
  get: (id) => api.get<Room>(item(id)),
  create: (payload) => api.post<Room>(COLLECTION, payload),
  update: (id, payload) => api.put<Room>(item(id), payload),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export const roomsApi = USE_MOCK_ROOMS ? mockRoomsApi : httpRoomsApi;

export type { Room, RoomPayload };
