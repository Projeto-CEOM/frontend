import type { DefaultValues } from "react-hook-form";
import type { Sensor } from "@/api/sensors";
import { numberField, percentField, yup } from "@/utils/validation";

export const sensorSchema = yup.object({
  identifier: yup.string().label("Identificador").trim().required().max(60),
  roomId: yup.string().label("Sala vinculada").required(),
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

export type SensorFormValues = yup.InferType<typeof sensorSchema>;

export const emptySensorValues: DefaultValues<SensorFormValues> = {
  identifier: "",
  roomId: "",
  tempMin: undefined,
  tempMax: undefined,
  humidityMin: undefined,
  humidityMax: undefined,
};

export const sensorToFormValues = (
  sensor: Sensor,
): DefaultValues<SensorFormValues> => ({
  identifier: sensor.identifier,
  roomId: sensor.roomId,
  tempMin: sensor.tempMin,
  tempMax: sensor.tempMax,
  humidityMin: sensor.humidityMin,
  humidityMax: sensor.humidityMax,
});
