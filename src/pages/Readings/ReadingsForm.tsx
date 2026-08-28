// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import { useSearchParams } from "react-router-dom";
// import { CircuitBoard, DoorOpen, Search } from "lucide-react";
// import { useRooms } from "@/api/queries/useRooms";
// import { useSensors } from "@/api/queries/useSensors";
// import RecordForm, {
//   type RecordFormField,
// } from "@/components/common/RecordForm";
// import { dateInputToISO, formatDateInput } from "@/utils/format";
// import {
//   emptyReadingsValues,
//   readingsSchema,
//   type ReadingsFormValues,
// } from "./schema";
//
// type ReadingsFormProps = {
//   onCancel: () => void;
// };
//
// const LOOKUP_PARAMS = { page: 1, pageSize: 200 };
//
// const isoToDateInput = (iso: string | null) => {
//   if (!iso) return "";
//
//   const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
//   return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
// };
//
// const ReadingsForm: React.FC<ReadingsFormProps> = ({ onCancel }) => {
//   const [searchParams, setSearchParams] = useSearchParams();
//
//   const { data: sensorsPage } = useSensors(LOOKUP_PARAMS);
//   const sensors = sensorsPage?.data ?? [];
//
//   const { data: roomsPage } = useRooms(LOOKUP_PARAMS);
//   const rooms = roomsPage?.data ?? [];
//
//   const form = useForm<ReadingsFormValues>({
//     resolver: yupResolver(readingsSchema),
//     defaultValues: emptyReadingsValues,
//   });
//
//   const { reset, setValue } = form;
//
//   useEffect(() => {
//     reset({
//       sensorId: searchParams.get("sensorId") ?? "",
//       roomId: searchParams.get("roomId") ?? "",
//       from: isoToDateInput(searchParams.get("from")),
//       to: isoToDateInput(searchParams.get("to")),
//     });
//   }, [searchParams, reset]);
//
//   const handleSubmit = (values: ReadingsFormValues) => {
//     const next = new URLSearchParams(searchParams);
//
//     const apply = (key: "sensorId" | "roomId" | "from" | "to") => {
//       const value = values[key]?.trim();
//
//       if (!value) {
//         next.delete(key);
//         return;
//       }
//
//       next.set(key, key === "from" || key === "to" ? dateInputToISO(value) : value);
//     };
//
//     (["sensorId", "roomId", "from", "to"] as const).forEach(apply);
//
//     next.delete("page");
//     next.delete("filtragem");
//
//     setSearchParams(next);
//   };
//
//   const fields: RecordFormField<ReadingsFormValues>[] = [
//     {
//       name: "sensorId",
//       label: "Sensor vinculado",
//       type: "select",
//       icon: CircuitBoard,
//       placeholder: "Todos os sensores",
//       options: sensors.map((sensor) => ({
//         value: sensor.id,
//         label: sensor.identifier,
//       })),
//     },
//     {
//       name: "roomId",
//       label: "Sala vinculada",
//       type: "select",
//       icon: DoorOpen,
//       placeholder: "Todas as salas",
//       options: rooms.map((room) => ({ value: room.id, label: room.name })),
//     },
//     {
//       groupLabel: "Intervalo",
//       fields: [
//         {
//           name: "from",
//           label: "De",
//           placeholder: "DD/MM/AAAA",
//           onValueChange: (value) => setValue("from", formatDateInput(value)),
//         },
//         {
//           name: "to",
//           label: "Até",
//           placeholder: "DD/MM/AAAA",
//           onValueChange: (value) => setValue("to", formatDateInput(value)),
//         },
//       ],
//     },
//   ];
//
//   return (
//     <RecordForm
//       title="Filtragem de leituras"
//       subtitle="Deixe um campo em branco para não filtrar por ele."
//       form={form}
//       fields={fields}
//       submitLabel="Filtrar"
//       submitIcon={<Search size={16} strokeWidth={1.8} />}
//       cancelLabel="Voltar para a lista"
//       onSubmit={handleSubmit}
//       onCancel={onCancel}
//     />
//   );
// };
//
// export default ReadingsForm;

export {};
