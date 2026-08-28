import type { DefaultValues } from "react-hook-form";
import { numberField, yup } from "@/utils/validation";

export const readingsSchema = yup.object({
  sensorId: yup.string().label("Sensor vinculado"),
  roomId: yup.string().label("Sala vinculada"),
  from: yup.date()
    .label("Data inicial")
    .max(new Date(), "Não pode ser uma data futura."),
  to: yup.date()
    .label("Data final")
    .min(yup.ref("from"), "Deve ser maior que a data mínima.")
    .max(new Date(), "Não pode ser uma data futura."),
});

export type ReadingsFormValues = yup.InferType<typeof readingsSchema>;

export const emptyReadingsValues: DefaultValues<ReadingsFormValues> = {
  sensorId: "",
  roomId: "",
  from: undefined,
  to: undefined,
};
