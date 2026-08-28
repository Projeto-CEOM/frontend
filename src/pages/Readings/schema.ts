import type { DefaultValues } from "react-hook-form";
import { numberField, yup } from "@/utils/validation";

export const readingsSchema = yup.object({
  sensorId: yup.string().label("Sensor vinculado"),
  roomId: yup.string().label("Sala vinculada"),
  dateMin: yup.date()
    .label("Data inicial")
    .max(new Date(), "Não pode ser uma data futura."),
  dateMax: yup.date()
    .label("Data final")
    .min(yup.ref("dateMin"), "Deve ser maior que a data mínima.")
    .max(new Date(), "Não pode ser uma data futura."),
  limit: numberField().label("Limite de registros"),
});

export type ReadingsFormValues = yup.InferType<typeof readingsSchema>;

export const emptyReadingsValues: DefaultValues<ReadingsFormValues> = {
  sensorId: "",
  roomId: "",
  dateMin: undefined,
  dateMax: undefined,
  limit: undefined,
};
