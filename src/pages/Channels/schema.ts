import { yup } from "@/utils/validation";
import type { DefaultValues } from "react-hook-form";
import type { Channel } from "@/api/types";

export const channelSchema = yup.object({
  name: yup
    .string()
    .label("Nome do Canal")
    .trim()
    .required("O nome do canal é obrigatório")
    .max(100),
  roomIds: yup
    .array()
    .of(yup.string().required())
    .default([]),
});

export type ChannelFormValues = yup.InferType<typeof channelSchema>;

export const emptyChannelValues: DefaultValues<ChannelFormValues> = {
  name: "",
  roomIds: [],
};

export const channelToFormValues = (
  channel: Channel,
): DefaultValues<ChannelFormValues> => ({
  name: channel.name ?? "",
  roomIds: channel.rooms?.map((r) => r.id) || [],
});