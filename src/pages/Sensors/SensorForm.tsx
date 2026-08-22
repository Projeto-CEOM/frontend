import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Cpu, Droplets, Save, Thermometer } from "lucide-react";
import { useRooms } from "@/api/queries/useRooms";
import {
  useCreateSensor,
  useSensor,
  useUpdateSensor,
} from "@/api/queries/useSensors";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import {
  emptySensorValues,
  sensorSchema,
  sensorToFormValues,
  type SensorFormValues,
} from "./schema";

type SensorFormProps = {
  sensorId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

const SensorForm: React.FC<SensorFormProps> = ({
  sensorId,
  onCancel,
  onSaved,
}) => {
  const { data: sensor, isLoading } = useSensor(sensorId);
  // Todas as salas para o select — ver ROOM_LOOKUP_PARAMS na listagem.
  const { data: roomsPage } = useRooms({ page: 1, pageSize: 200 });
  const rooms = roomsPage?.data ?? [];
  const createSensor = useCreateSensor();
  const updateSensor = useUpdateSensor();

  const form = useForm<SensorFormValues>({
    resolver: yupResolver(sensorSchema),
    defaultValues: emptySensorValues,
  });

  const { reset, setValue } = form;

  useEffect(() => {
    if (sensor) reset(sensorToFormValues(sensor));
  }, [sensor, reset]);

  /** Ao escolher a sala, herda os limites cadastrados nela. */
  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((current) => current.id === roomId);
    if (!room) return;

    const options = { shouldValidate: form.formState.isSubmitted };

    // A sala pode não ter faixas cadastradas — nesse caso não sobrescreve.
    (["tempMin", "tempMax", "humidityMin", "humidityMax"] as const).forEach(
      (field) => {
        const value = room[field];
        if (value !== undefined) setValue(field, value, options);
      },
    );
  };

  const handleSubmit = (values: SensorFormValues) => {
    if (sensorId) {
      updateSensor.mutate({ id: sensorId, payload: values });
    } else {
      createSensor.mutate(values);
    }

    onSaved();
  };

  const fields: RecordFormField<SensorFormValues>[] = [
    {
      name: "identifier",
      label: "Identificador",
      icon: Cpu,
      placeholder: "Ex: ESP32-01",
      required: true,
    },
    {
      name: "roomId",
      label: "Sala vinculada",
      type: "select",
      placeholder: "Selecione uma sala",
      options: rooms.map((room) => ({ value: room.id, label: room.name })),
      required: true,
      onValueChange: handleRoomChange,
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
      title={sensorId ? "Editar sensor" : "Cadastro de sensor"}
      subtitle={
        sensorId
          ? "Atualize as informações e os limites de segurança deste sensor."
          : "Vincule o sensor a uma sala — os limites de temperatura e umidade dela preenchem automaticamente, mas podem ser ajustados."
      }
      form={form}
      fields={fields}
      isLoading={Boolean(sensorId) && isLoading}
      submitLabel={sensorId ? "Salvar alterações" : "Salvar sensor"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default SensorForm;
