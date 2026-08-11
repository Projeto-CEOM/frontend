import { useEffect, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Cpu,
  Save,
  Plus,
  Trash2,
  Pencil,
  Thermometer,
  Droplets,
} from "lucide-react";
import Button from "../../components/common/Button";
import DataTable, {
  type DataTableColumn,
} from "../../components/common/DataTable";
import RecordForm, {
  type RecordFormField,
} from "../../components/common/RecordForm";
import { useRooms } from "../../contexts/RoomsContext";

type Sensor = {
  id: string;
  identifier: string;
  roomId: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
};

const initialSensors: Sensor[] = [
  {
    id: "sensor-1",
    identifier: "ESP32-01",
    roomId: "seed-1",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "sensor-2",
    identifier: "ESP32-02",
    roomId: "seed-2",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "sensor-3",
    identifier: "ESP32-03",
    roomId: "seed-3",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "sensor-4",
    identifier: "ESP32-04",
    roomId: "seed-4",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "sensor-5",
    identifier: "ESP32-05",
    roomId: "seed-5",
    tempMin: 17,
    tempMax: 20,
    humidityMin: 40,
    humidityMax: 50,
  },
  {
    id: "sensor-6",
    identifier: "ESP32-06",
    roomId: "seed-6",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 55,
  },
  {
    id: "sensor-7",
    identifier: "ESP32-07",
    roomId: "seed-7",
    tempMin: 19,
    tempMax: 24,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "sensor-8",
    identifier: "ESP32-08",
    roomId: "seed-8",
    tempMin: 20,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "sensor-9",
    identifier: "ESP32-09",
    roomId: "seed-9",
    tempMin: 20,
    tempMax: 25,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "sensor-10",
    identifier: "ESP32-10",
    roomId: "seed-10",
    tempMin: 18,
    tempMax: 23,
    humidityMin: 45,
    humidityMax: 58,
  },
  {
    id: "sensor-11",
    identifier: "ESP32-11",
    roomId: "seed-11",
    tempMin: 16,
    tempMax: 19,
    humidityMin: 35,
    humidityMax: 45,
  },
  {
    id: "sensor-12",
    identifier: "ESP32-12",
    roomId: "seed-12",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
];

const initialFields = {
  identifier: "",
  roomId: "",
  tempMin: "",
  tempMax: "",
  humidityMin: "",
  humidityMax: "",
};

const sensorToFields = (sensor: Sensor) => ({
  identifier: sensor.identifier,
  roomId: sensor.roomId,
  tempMin: String(sensor.tempMin),
  tempMax: String(sensor.tempMax),
  humidityMin: String(sensor.humidityMin),
  humidityMax: String(sensor.humidityMax),
});

const Sensors: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { rooms } = useRooms();
  const [sensors, setSensors] = useState<Sensor[]>(initialSensors);
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof initialFields, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formParam = searchParams.get("sensor");
  const isFormOpen = formParam !== null;
  const editingSensorId = formParam && formParam !== "novo" ? formParam : null;

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  useEffect(() => {
    if (!formParam) return;

    if (formParam === "novo") {
      setFields(initialFields);
    } else {
      const sensor = sensors.find((current) => current.id === formParam);
      if (sensor) {
        setFields(sensorToFields(sensor));
      }
    }

    setError("");
    setFieldErrors({});
  }, [formParam]);

  const updateField = (key: keyof typeof initialFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((current) => current.id === roomId);

    setFields((current) => ({
      ...current,
      roomId,
      ...(room
        ? {
            tempMin: String(room.tempMin),
            tempMax: String(room.tempMax),
            humidityMin: String(room.humidityMin),
            humidityMax: String(room.humidityMax),
          }
        : {}),
    }));

    setFieldErrors((current) => {
      const next = { ...current };
      delete next.roomId;
      if (room) {
        delete next.tempMin;
        delete next.tempMax;
        delete next.humidityMin;
        delete next.humidityMax;
      }
      return next;
    });
  };

  const openForm = (sensor?: Sensor) => {
    const next = new URLSearchParams(searchParams);
    next.set("sensor", sensor ? sensor.id : "novo");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sensor");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const handleDelete = (id: string) => {
    setSensors((current) => current.filter((sensor) => sensor.id !== id));
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { identifier, roomId, tempMin, tempMax, humidityMin, humidityMax } =
      fields;
    const nextFieldErrors: Partial<Record<keyof typeof initialFields, string>> =
      {};

    if (!identifier.trim()) {
      nextFieldErrors.identifier = "Preencha o identificador do sensor.";
    }
    if (!roomId.trim()) {
      nextFieldErrors.roomId = "Selecione a sala vinculada.";
    }
    if (!tempMin.trim()) {
      nextFieldErrors.tempMin = "Campo obrigatório.";
    }
    if (!tempMax.trim()) {
      nextFieldErrors.tempMax = "Campo obrigatório.";
    }
    if (!humidityMin.trim()) {
      nextFieldErrors.humidityMin = "Campo obrigatório.";
    }
    if (!humidityMax.trim()) {
      nextFieldErrors.humidityMax = "Campo obrigatório.";
    }

    if (
      !nextFieldErrors.tempMin &&
      !nextFieldErrors.tempMax &&
      Number(tempMin) >= Number(tempMax)
    ) {
      nextFieldErrors.tempMin = "Deve ser menor que a máxima.";
      nextFieldErrors.tempMax = "Deve ser maior que a mínima.";
    }

    if (!nextFieldErrors.humidityMin) {
      if (Number(humidityMin) < 0 || Number(humidityMin) > 100) {
        nextFieldErrors.humidityMin = "Deve ficar entre 0% e 100%.";
      }
    }
    if (!nextFieldErrors.humidityMax) {
      if (Number(humidityMax) < 0 || Number(humidityMax) > 100) {
        nextFieldErrors.humidityMax = "Deve ficar entre 0% e 100%.";
      }
    }

    if (
      !nextFieldErrors.humidityMin &&
      !nextFieldErrors.humidityMax &&
      Number(humidityMin) >= Number(humidityMax)
    ) {
      nextFieldErrors.humidityMin = "Deve ser menor que a máxima.";
      nextFieldErrors.humidityMax = "Deve ser maior que a mínima.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setError("Corrija os campos destacados abaixo.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const sensorData = {
      identifier: identifier.trim(),
      roomId,
      tempMin: Number(tempMin),
      tempMax: Number(tempMax),
      humidityMin: Number(humidityMin),
      humidityMax: Number(humidityMax),
    };

    setTimeout(() => {
      const newTotal = editingSensorId ? sensors.length : sensors.length + 1;

      setSensors((current) =>
        editingSensorId
          ? current.map((sensor) =>
              sensor.id === editingSensorId
                ? { ...sensor, ...sensorData }
                : sensor,
            )
          : [...current, { id: crypto.randomUUID(), ...sensorData }],
      );

      setIsSubmitting(false);

      const next = new URLSearchParams(searchParams);
      next.delete("sensor");
      if (!editingSensorId) {
        next.set("page", String(Math.ceil(newTotal / 10)));
      }
      setSearchParams(next);
    }, 500);
  };

  const formFields: RecordFormField[] = [
    {
      id: "identifier",
      label: "Identificador",
      icon: Cpu,
      placeholder: "Ex: ESP32-01",
      value: fields.identifier,
      onChange: (value) => updateField("identifier", value),
      required: true,
      error: fieldErrors.identifier,
    },
    {
      id: "roomId",
      label: "Sala vinculada",
      type: "select",
      placeholder: "Selecione uma sala",
      options: rooms.map((room) => ({ value: room.id, label: room.name })),
      value: fields.roomId,
      onChange: handleRoomChange,
      required: true,
      error: fieldErrors.roomId,
    },
    {
      groupLabel: "Faixa de temperatura (°C)",
      fields: [
        {
          id: "tempMin",
          type: "number",
          step: "0.1",
          icon: Thermometer,
          placeholder: "Mínima",
          value: fields.tempMin,
          onChange: (value) => updateField("tempMin", value),
          required: true,
          error: fieldErrors.tempMin,
        },
        {
          id: "tempMax",
          type: "number",
          step: "0.1",
          icon: Thermometer,
          placeholder: "Máxima",
          value: fields.tempMax,
          onChange: (value) => updateField("tempMax", value),
          required: true,
          error: fieldErrors.tempMax,
        },
      ],
    },
    {
      groupLabel: "Faixa de umidade relativa (%)",
      fields: [
        {
          id: "humidityMin",
          type: "number",
          step: "1",
          min: "0",
          max: "100",
          icon: Droplets,
          placeholder: "Mínima",
          value: fields.humidityMin,
          onChange: (value) => updateField("humidityMin", value),
          required: true,
          error: fieldErrors.humidityMin,
        },
        {
          id: "humidityMax",
          type: "number",
          step: "1",
          min: "0",
          max: "100",
          icon: Droplets,
          placeholder: "Máxima",
          value: fields.humidityMax,
          onChange: (value) => updateField("humidityMax", value),
          required: true,
          error: fieldErrors.humidityMax,
        },
      ],
    },
  ];

  if (isFormOpen) {
    return (
      <RecordForm
        title={editingSensorId ? "Editar sensor" : "Cadastro de sensor"}
        subtitle={
          editingSensorId
            ? "Atualize as informações e os limites de segurança deste sensor."
            : "Vincule o sensor a uma sala — os limites de temperatura e umidade dela preenchem automaticamente, mas podem ser ajustados."
        }
        fields={formFields}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel={editingSensorId ? "Salvar alterações" : "Salvar sensor"}
        submittingLabel="Salvando..."
        submitIcon={<Save size={16} strokeWidth={1.8} />}
        onSubmit={handleSubmit}
        onCancel={closeForm}
      />
    );
  }

  const columns: DataTableColumn<Sensor>[] = [
    {
      header: "Identificador",
      align: "left",
      width: "25%",
      render: (sensor) => (
        <span className="font-medium text-ink">{sensor.identifier}</span>
      ),
    },
    {
      header: "Sala",
      align: "left",
      width: "35%",
      render: (sensor) => (
        <span className="text-ink-soft">
          {rooms.find((room) => room.id === sensor.roomId)?.name ??
            "Sala removida"}
        </span>
      ),
    },
    {
      header: "Temperatura",
      align: "center",
      width: "15%",
      render: (sensor) => (
        <span className="text-ink-soft">
          {sensor.tempMin}°C – {sensor.tempMax}°C
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (sensor) => (
        <span className="text-ink-soft">
          {sensor.humidityMin}% – {sensor.humidityMax}%
        </span>
      ),
    },
    {
      header: "Ações",
      align: "center",
      width: "10%",
      render: (sensor) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => openForm(sensor)}
            aria-label={`Editar ${sensor.identifier}`}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Pencil size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(sensor.id)}
            aria-label={`Remover ${sensor.identifier}`}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={16} strokeWidth={1.8} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Sensores</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Dispositivos de coleta cadastrados e as salas que monitoram.
          </p>
        </div>

        <Button
          icon={<Plus size={16} strokeWidth={1.8} />}
          onClick={() => openForm()}
        >
          Novo sensor
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={sensors}
          getRowKey={(sensor) => sensor.id}
          page={page}
          onPageChange={goToPage}
          emptyMessage="Nenhum sensor cadastrado ainda."
        />
      </div>
    </div>
  );
};

export default Sensors;
