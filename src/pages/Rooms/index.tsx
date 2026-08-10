import { useEffect, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DoorOpen,
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

type Room = {
  id: string;
  name: string;
  description: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
};

const initialRooms: Room[] = [
  {
    id: "seed-1",
    name: "Reserva Técnica 1",
    description: "Documentos e têxteis do acervo permanente.",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-2",
    name: "Sala de Exposição Permanente",
    description: "",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "seed-3",
    name: "Sala de Exposição Temporária",
    description: "",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "seed-4",
    name: "Reserva Técnica 2",
    description: "Objetos tridimensionais e cerâmica.",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-5",
    name: "Arquivo Documental",
    description: "Documentos em papel e microfilmes.",
    tempMin: 17,
    tempMax: 20,
    humidityMin: 40,
    humidityMax: 50,
  },
  {
    id: "seed-6",
    name: "Biblioteca",
    description: "",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 55,
  },
  {
    id: "seed-7",
    name: "Laboratório de Conservação",
    description: "Restauração e higienização de peças.",
    tempMin: 19,
    tempMax: 24,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-8",
    name: "Sala de Recepção",
    description: "",
    tempMin: 20,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "seed-9",
    name: "Auditório",
    description: "",
    tempMin: 20,
    tempMax: 25,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "seed-10",
    name: "Depósito de Mobiliário",
    description: "Móveis históricos de grande porte.",
    tempMin: 18,
    tempMax: 23,
    humidityMin: 45,
    humidityMax: 58,
  },
  {
    id: "seed-11",
    name: "Sala de Fotografias",
    description: "Acervo fotográfico e negativos.",
    tempMin: 16,
    tempMax: 19,
    humidityMin: 35,
    humidityMax: 45,
  },
  {
    id: "seed-12",
    name: "Acervo Têxtil",
    description: "Vestimentas e tecidos históricos.",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-13",
    name: "Sala de Mapas",
    description: "",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 50,
  },
  {
    id: "seed-14",
    name: "Sala de Numismática",
    description: "Moedas e cédulas históricas.",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 50,
  },
];

const initialFields = {
  name: "",
  description: "",
  tempMin: "",
  tempMax: "",
  humidityMin: "",
  humidityMax: "",
};

const roomToFields = (room: Room) => ({
  name: room.name,
  description: room.description,
  tempMin: String(room.tempMin),
  tempMax: String(room.tempMax),
  humidityMin: String(room.humidityMin),
  humidityMax: String(room.humidityMax),
});

const Rooms: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof initialFields, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formParam = searchParams.get("sala");
  const isFormOpen = formParam !== null;
  const editingRoomId = formParam && formParam !== "nova" ? formParam : null;

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  useEffect(() => {
    if (!formParam) return;

    if (formParam === "nova") {
      setFields(initialFields);
    } else {
      const room = rooms.find((current) => current.id === formParam);
      if (room) {
        setFields(roomToFields(room));
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

  const openForm = (room?: Room) => {
    const next = new URLSearchParams(searchParams);
    next.set("sala", room ? room.id : "nova");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sala");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const handleDelete = (id: string) => {
    setRooms((current) => current.filter((room) => room.id !== id));
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { name, tempMin, tempMax, humidityMin, humidityMax } = fields;
    const nextFieldErrors: Partial<Record<keyof typeof initialFields, string>> =
      {};

    if (!name.trim()) {
      nextFieldErrors.name = "Preencha o nome da sala.";
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

    const roomData = {
      name: fields.name.trim(),
      description: fields.description.trim(),
      tempMin: Number(tempMin),
      tempMax: Number(tempMax),
      humidityMin: Number(humidityMin),
      humidityMax: Number(humidityMax),
    };

    setTimeout(() => {
      const updatedRooms = editingRoomId
        ? rooms.map((room) =>
            room.id === editingRoomId ? { ...room, ...roomData } : room,
          )
        : [...rooms, { id: crypto.randomUUID(), ...roomData }];

      setRooms(updatedRooms);
      setIsSubmitting(false);

      const next = new URLSearchParams(searchParams);
      next.delete("sala");
      if (!editingRoomId) {
        next.set("page", String(Math.ceil(updatedRooms.length / 10)));
      }
      setSearchParams(next);
    }, 500);
  };

  const formFields: RecordFormField[] = [
    {
      id: "name",
      label: "Nome da sala",
      icon: DoorOpen,
      placeholder: "Ex: Reserva Técnica 1",
      value: fields.name,
      onChange: (value) => updateField("name", value),
      required: true,
      error: fieldErrors.name,
    },
    {
      id: "description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Observações sobre o acervo guardado neste espaço",
      value: fields.description,
      onChange: (value) => updateField("description", value),
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
        title={editingRoomId ? "Editar sala" : "Cadastro de sala"}
        subtitle={
          editingRoomId
            ? "Atualize as informações e os limites de segurança desta sala."
            : "Adicione um novo ponto de monitoramento e defina os limites de temperatura e umidade que disparam alertas."
        }
        fields={formFields}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel={editingRoomId ? "Salvar alterações" : "Salvar sala"}
        submittingLabel="Salvando..."
        submitIcon={<Save size={16} strokeWidth={1.8} />}
        onSubmit={handleSubmit}
        onCancel={closeForm}
      />
    );
  }

  const columns: DataTableColumn<Room>[] = [
    {
      header: "Nome",
      align: "left",
      width: "25%",
      render: (room) => (
        <span className="font-medium text-ink">{room.name}</span>
      ),
    },
    {
      header: "Descrição",
      align: "left",
      width: "35%",
      render: (room) => (
        <span className="text-ink-soft">
          {room.description || "Sem descrição"}
        </span>
      ),
    },
    {
      header: "Temperatura",
      align: "center",
      width: "15%",
      render: (room) => (
        <span className="text-ink-soft">
          {room.tempMin}°C – {room.tempMax}°C
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (room) => (
        <span className="text-ink-soft">
          {room.humidityMin}% – {room.humidityMax}%
        </span>
      ),
    },
    {
      header: "Ações",
      align: "center",
      width: "10%",
      render: (room) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => openForm(room)}
            aria-label={`Editar ${room.name}`}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Pencil size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(room.id)}
            aria-label={`Remover ${room.name}`}
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
          <h1 className="text-2xl font-semibold text-ink">Salas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pontos de monitoramento cadastrados.
          </p>
        </div>

        <Button
          icon={<Plus size={16} strokeWidth={1.8} />}
          onClick={() => openForm()}
        >
          Nova sala
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={rooms}
          getRowKey={(room) => room.id}
          page={page}
          onPageChange={goToPage}
          emptyMessage="Nenhuma sala cadastrada ainda."
        />
      </div>
    </div>
  );
};

export default Rooms;
