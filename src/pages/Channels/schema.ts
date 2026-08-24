import type { DefaultValues } from "react-hook-form";
import { yup } from "@/utils/validation";
import type { Channel } from "@/api/channels";


export const channelSchema = yup.object({
  telegramId: yup.string().label("ID do Telegram").trim().required(),
  name: yup.string().label("Nome do Canal").trim().optional(),
});

export type ChannelFormValues = yup.InferType<typeof channelSchema>;

export const emptyChannelValues: DefaultValues<ChannelFormValues> = {
  telegramId: "",
  name: "",
};

export const channelToFormValues = (
  channel: Channel,
): DefaultValues<ChannelFormValues> => ({
  telegramId: channel.telegramId,
  name: channel.name ?? "", 
});