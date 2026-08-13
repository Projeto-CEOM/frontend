import { queryKeys } from "../keys";
import { roomsApi, type Room, type RoomPayload } from "../rooms";
import { createCrudQueries } from "./createCrudQueries";

const roomQueries = createCrudQueries<Room, RoomPayload>({
  api: roomsApi,
  keys: queryKeys.rooms,
  messages: {
    created: "Sala cadastrada com sucesso.",
    updated: "Sala atualizada com sucesso.",
    removed: "Sala removida com sucesso.",
  },
  // Sensores apontam para salas: remover/renomear uma sala afeta a listagem.
  relatedKeys: [queryKeys.sensors.all],
});

export const {
  useList: useRooms,
  useDetail: useRoom,
  useCreate: useCreateRoom,
  useUpdate: useUpdateRoom,
  useDelete: useDeleteRoom,
} = roomQueries;
