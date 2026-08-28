// import type { DefaultValues } from "react-hook-form";
// import { yup } from "@/utils/validation";
// import { dateInputToISO } from "@/utils/format";
//
// const dateField = (label: string) =>
//   yup
//     .string()
//     .label(label)
//     .trim()
//     .optional()
//     .test("data-valida", "Use uma data válida no formato DD/MM/AAAA.", (value) =>
//       !value ? true : dateInputToISO(value) !== "",
//     );
//
// export const readingsSchema = yup.object({
//   sensorId: yup.string().label("Sensor vinculado").optional(),
//   roomId: yup.string().label("Sala vinculada").optional(),
//   from: dateField("Data inicial"),
//   to: dateField("Data final").test(
//     "intervalo",
//     "A data final deve ser igual ou posterior à inicial.",
//     function (value) {
//       const from = this.parent.from as string | undefined;
//       if (!value || !from) return true;
//
//       const fromISO = dateInputToISO(from);
//       const toISO = dateInputToISO(value);
//
//       return !fromISO || !toISO || toISO >= fromISO;
//     },
//   ),
// });
//
// export type ReadingsFormValues = yup.InferType<typeof readingsSchema>;
//
// export const emptyReadingsValues: DefaultValues<ReadingsFormValues> = {
//   sensorId: "",
//   roomId: "",
//   from: "",
//   to: "",
// };

export {};
