import type { DefaultValues } from "react-hook-form";
import type { Room } from "@/api/rooms";
import { numberField, percentField, yup } from "@/utils/validation";

export const roomSchema = yup.object({
  name: yup.string().label("Nome da sala").trim().required().max(120),
  description: yup.string().label("Descrição").trim().max(500).default(""),
  tempMin: numberField().label("Temperatura mínima").required().min(-50).max(80),
  tempMax: numberField()
    .label("Temperatura máxima")
    .required()
    .min(-50)
    .max(80)
    .moreThan(yup.ref("tempMin"), "Deve ser maior que a temperatura mínima."),
  humidityMin: percentField().label("Umidade mínima").required(),
  humidityMax: percentField()
    .label("Umidade máxima")
    .required()
    .moreThan(yup.ref("humidityMin"), "Deve ser maior que a umidade mínima."),
});

export type RoomFormValues = yup.InferType<typeof roomSchema>;

export const emptyRoomValues: DefaultValues<RoomFormValues> = {
  name: "",
  description: "",
  tempMin: undefined,
  tempMax: undefined,
  humidityMin: undefined,
  humidityMax: undefined,
};

/** As faixas podem não vir do backend ainda — o form abre com elas em branco. */
export const roomToFormValues = (room: Room): DefaultValues<RoomFormValues> => ({
  name: room.name,
  description: room.description,
  tempMin: room.tempMin,
  tempMax: room.tempMax,
  humidityMin: room.humidityMin,
  humidityMax: room.humidityMax,
});
