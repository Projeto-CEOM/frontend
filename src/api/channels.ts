import api from "./client";
import type { CrudApi, Paginated, Channel, ChannelPayload } from "./types";

const COLLECTION = "/api/telegram/";
const item = (id: string) => `/api/telegram/${id}`;

export const channelsApi = {
  list: (params?: any) => api.get<Paginated<Channel>>(COLLECTION, { params }),
  get: (id: string) => api.get<Channel>(item(id)),
  create: (payload: ChannelPayload) => api.post<Channel>(COLLECTION, payload),
  update: (id: string, payload: ChannelPayload) => api.put<Channel>(item(id), payload),
  remove: (id: string) => api.del<void>(item(id)).then(() => undefined),
  listByRoom: (roomId: string, params?: any) => 
    api.get<Paginated<Channel>>(`/api/telegram/room/${roomId}`, { params }),
  linkRoom: (id: string, roomId: string) => 
    api.post<void>(`/api/telegram/${id}/rooms`, { roomId }),
  unlinkRoom: (id: string, roomId: string) => 
    api.del<void>(`/api/telegram/${id}/rooms/${roomId}`),
};

export type { Channel, ChannelPayload };