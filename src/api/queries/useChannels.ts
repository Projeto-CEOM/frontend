import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { channelsApi } from "../channels";
import type { Channel, ChannelPayload, ListParams } from "../types"; 
import { createCrudQueries } from "./createCrudQueries";

const channelQueries = createCrudQueries<Channel, ChannelPayload>({
  api: channelsApi,
  keys: queryKeys.channels,
  messages: {
    created: "Canal cadastrado com sucesso.",
    updated: "Canal atualizado com sucesso.",
    removed: "Canal removido com sucesso.",
  },
});

export const {
  useList: useChannels,
  useDetail: useChannel,
  useCreate: useCreateChannel,
  useUpdate: useUpdateChannel,
  useDelete: useDeleteChannel,
} = channelQueries;

export const useChannelsByRoom = (roomId: string, params?: ListParams) => {
  return useQuery({
    queryKey: [...queryKeys.channels.all, "room", roomId, params],
    queryFn: () => channelsApi.listByRoom(roomId, params),
    enabled: Boolean(roomId), 
  });
};

export const useLinkRoomToChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, roomId }: { channelId: string; roomId: string }) =>
      channelsApi.linkRoom(channelId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all });
    },
  });
};

export const useUnlinkRoomFromChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, roomId }: { channelId: string; roomId: string }) =>
      channelsApi.unlinkRoom(channelId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all });
    },
  });
};

export const useVerifyTelegram = () => {
  return useMutation({
    mutationFn: () => channelsApi.verifyStart(),
  });
};

export const useCreateTelegramGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => channelsApi.createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all });
    },
  })
};