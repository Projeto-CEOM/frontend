import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { List, Save } from "lucide-react";
import { useRooms } from "@/api/queries/useRooms";
import {
  useSensors,
} from "@/api/queries/useSensors";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import {
  emptyReadingsValues,
  readingsSchema,
  type ReadingsFormValues,
} from "./schema";
import { useSearchParams } from "react-router-dom";

type ReadingsFormProps = {
  sensorId: string | null;
  roomId: string | null;
  from: string | null;
  to: string | null;
  limit: string | null;

  onCancel: () => void;
  onSaved: () => void;
};

const ReadingsForm: React.FC<ReadingsFormProps> = ({
  sensorId,
  onCancel,
  onSaved,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sensorsPage } = useSensors({ page: 1, pageSize: 200 });
  const sensors = sensorsPage?.data ?? [];
  // Todas as salas para o select — ver ROOM_LOOKUP_PARAMS na listagem.
  const { data: roomsPage } = useRooms({ page: 1, pageSize: 200 });
  const rooms = roomsPage?.data ?? [];

  const form = useForm<ReadingsFormValues>({
    resolver: yupResolver(readingsSchema),
    defaultValues: emptyReadingsValues,
  });

  const { reset, setValue } = form;

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    Object.keys(params).forEach((key) => {
      if (["sensorId", "roomId", "from", "to"].includes(key)) {
        if (key == "from" || key == "to") {
          setValue(key, String(params[key]).slice(0, 10))
        } else {
          setValue(key, params[key])
        }
      }
    })

  }, [searchParams]);

  const handleSubmit = (values: ReadingsFormValues) => {
    const next = new URLSearchParams(searchParams);

    Object.keys(values).forEach((key) => {
      if (String(values[key] != "")) {
        if (key == "from" || key == "to") {
          const date = new Date(values[key])
          next.set(key, date.toISOString());
        } else {
          next.set(key, String(values[key]));
        }
      } else {
        next.delete(key)
      }
    })
    next.delete("filtragem");
    setSearchParams(next);
    // onSaved();
  };

  const fields: RecordFormField<ReadingsFormValues>[] = [
    {
      name: "sensorId",
      label: "Sensor vinculado",
      type: "select",
      placeholder: "Selecione os sensores",
      options: sensors.map((sensor) => ({ value: sensor.id, label: sensor.identifier })),
      required: false,
    },
    {
      name: "roomId",
      label: "Sala vinculada",
      type: "select",
      placeholder: "Selecione uma sala",
      options: rooms.map((room) => ({ value: room.id, label: room.name })),
      required: false,
    },
    {
      groupLabel: "Intervalo",
      fields: [
        {
          name: "from",
          type: "date",
          step: "0.1",
          placeholder: "Início",
          required: false,
        },
        {
          name: "to",
          type: "date",
          step: "0.1",
          placeholder: "Fim",
          required: false,
        },
      ],
    },
  ];

  return (
    <RecordForm
      title={"Filtragem de leituras"}
      subtitle={"Selecione os parametros para filtragem"}
      form={form}
      fields={fields}
      // isLoading={isLoading}
      submitLabel={"Filtrar"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default ReadingsForm;
