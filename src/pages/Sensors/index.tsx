import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useRooms } from "@/api/queries/useRooms";
import { useDeleteSensor, useSensors } from "@/api/queries/useSensors";
import type { Sensor } from "@/api/sensors";
import Button from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { usePermissions } from "@/hooks/UsePermissions";
import { formatRange } from "@/utils/format";
import SensorForm from "./SensorForm";

const PAGE_SIZE = 10;

const Sensors: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sensors = [], isLoading, isError, error } = useSensors();
  const { data: rooms = [] } = useRooms();
  const deleteSensor = useDeleteSensor();
  const { can } = usePermissions();

  const formParam = searchParams.get("sensor");
  const isFormOpen = formParam !== null;
  const editingSensorId = formParam && formParam !== "novo" ? formParam : null;
  const formAllowed = isFormOpen && (editingSensorId ? can("u") : can("c"));

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

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

  const handleSaved = (created: boolean) => {
    const next = new URLSearchParams(searchParams);
    next.delete("sensor");
    if (created) {
      next.set("page", String(Math.ceil((sensors.length + 1) / PAGE_SIZE)));
    }
    setSearchParams(next);
  };

  useEffect(() => {
    if (isFormOpen && !formAllowed) closeForm();
  }, [isFormOpen, formAllowed]);

  if (isFormOpen) {
    if (!formAllowed) return null;

    return (
      <SensorForm
        sensorId={editingSensorId}
        onCancel={closeForm}
        onSaved={handleSaved}
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
          {formatRange(sensor.tempMin, sensor.tempMax, "°C")}
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (sensor) => (
        <span className="text-ink-soft">
          {formatRange(sensor.humidityMin, sensor.humidityMax, "%")}
        </span>
      ),
    },
    ...(can("u") || can("d")
      ? [
          {
            header: "Ações",
            align: "center" as const,
            width: "10%",
            render: (sensor: Sensor) => (
              <div className="flex items-center justify-center gap-1">
                {can("u") && (
                  <button
                    type="button"
                    onClick={() => openForm(sensor)}
                    aria-label={`Editar ${sensor.identifier}`}
                    className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil size={16} strokeWidth={1.8} />
                  </button>
                )}
                {can("d") && (
                  <button
                    type="button"
                    onClick={() => deleteSensor.mutate(sensor.id)}
                    aria-label={`Remover ${sensor.identifier}`}
                    className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
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

        {can("c") && (
          <Button
            icon={<Plus size={16} strokeWidth={1.8} />}
            onClick={() => openForm()}
          >
            Novo sensor
          </Button>
        )}
      </div>

      {isError && sensors.length === 0 && (
        <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error.message}
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={sensors}
          getRowKey={(sensor) => sensor.id}
          page={page}
          onPageChange={goToPage}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage="Nenhum sensor cadastrado ainda."
        />
      </div>
    </div>
  );
};

export default Sensors;
