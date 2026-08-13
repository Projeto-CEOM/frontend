import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { DoorOpen, Droplets, Save, Thermometer } from "lucide-react";
import { useCreateRoom, useRoom, useUpdateRoom } from "@/api/queries/useRooms";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import {
  emptyRoomValues,
  roomSchema,
  roomToFormValues,
  type RoomFormValues,
} from "./schema";

type RoomFormProps = {
  roomId: string | null;
  onCancel: () => void;
  onSaved: (created: boolean) => void;
};

const RoomForm: React.FC<RoomFormProps> = ({ roomId, onCancel, onSaved }) => {
  const { data: room, isLoading } = useRoom(roomId);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const form = useForm<RoomFormValues>({
    resolver: yupResolver(roomSchema),
    defaultValues: emptyRoomValues,
  });

  const { reset } = form;

  useEffect(() => {
    if (room) reset(roomToFormValues(room));
  }, [room, reset]);

  // Mutations otimistas: a lista já reflete a mudança, então a tela volta na
  // hora. Se a API recusar, o cache é revertido e o toast avisa.
  const handleSubmit = (values: RoomFormValues) => {
    if (roomId) {
      updateRoom.mutate({ id: roomId, payload: values });
    } else {
      createRoom.mutate(values);
    }

    onSaved(!roomId);
  };

  const fields: RecordFormField<RoomFormValues>[] = [
    {
      name: "name",
      label: "Nome da sala",
      icon: DoorOpen,
      placeholder: "Ex: Reserva Técnica 1",
      required: true,
    },
    {
      name: "description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Observações sobre o acervo guardado neste espaço",
    },
    {
      groupLabel: "Faixa de temperatura (°C)",
      fields: [
        {
          name: "tempMin",
          type: "number",
          step: "0.1",
          icon: Thermometer,
          placeholder: "Mínima",
          required: true,
        },
        {
          name: "tempMax",
          type: "number",
          step: "0.1",
          icon: Thermometer,
          placeholder: "Máxima",
          required: true,
        },
      ],
    },
    {
      groupLabel: "Faixa de umidade relativa (%)",
      fields: [
        {
          name: "humidityMin",
          type: "number",
          step: "1",
          min: "0",
          max: "100",
          icon: Droplets,
          placeholder: "Mínima",
          required: true,
        },
        {
          name: "humidityMax",
          type: "number",
          step: "1",
          min: "0",
          max: "100",
          icon: Droplets,
          placeholder: "Máxima",
          required: true,
        },
      ],
    },
  ];

  return (
    <RecordForm
      title={roomId ? "Editar sala" : "Cadastro de sala"}
      subtitle={
        roomId
          ? "Atualize as informações e os limites de segurança desta sala."
          : "Adicione um novo ponto de monitoramento e defina os limites de temperatura e umidade que disparam alertas."
      }
      form={form}
      fields={fields}
      isLoading={Boolean(roomId) && isLoading}
      submitLabel={roomId ? "Salvar alterações" : "Salvar sala"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default RoomForm;
