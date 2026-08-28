import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useReadings } from "@/api/queries/useReadings";
import { useRooms } from "@/api/queries/useRooms";
import { useSensors } from "@/api/queries/useSensors";
import type { SensorReading } from "@/api/readings";
import Button from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import {
  DATE_INPUT_LENGTH,
  dateInputError,
  dateInputToISO,
  formatDateInput,
  formatDateTime,
} from "@/utils/format";

// import ReadingsForm from "./ReadingsForm";   // filtro antigo — ver arquivo

const PAGE_SIZE = 15;

const LOOKUP_PARAMS = { page: 1, pageSize: 200 };

const formatMeasure = (value: number | null, unit: string) =>
  value === null ? "—" : `${value.toFixed(1)}${unit}`;

const Readings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const roomId = searchParams.get("roomId") ?? "";
  const sensorId = searchParams.get("sensorId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const fromISO = dateInputToISO(from);
  const toISO = dateInputToISO(to);

  const { data, isLoading, isError, error } = useReadings({
    page,
    pageSize: PAGE_SIZE,
    ...(roomId && { roomId }),
    ...(sensorId && { sensorId }),
    ...(fromISO && { from: fromISO }),
    ...(toISO && { to: toISO }),
  });

  const readings = data?.data ?? [];
  const meta = data?.meta;

  const { data: roomsPage } = useRooms(LOOKUP_PARAMS);
  const rooms = roomsPage?.data ?? [];
  const { data: sensorsPage } = useSensors(LOOKUP_PARAMS);
  const sensors = sensorsPage?.data ?? [];

  const sensorOptions = (
    roomId ? sensors.filter((sensor) => sensor.roomId === roomId) : sensors
  ).map((sensor) => ({ value: sensor.id, label: sensor.identifier }));

  const updateParams = (mutate: (params: URLSearchParams) => void) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      mutate(next);
      return next;
    });

  const updateFilter = (key: string, value: string) =>
    updateParams((next) => {
      if (value) next.set(key, value);
      else next.delete(key);

      next.delete("page");
    });

  const updateRoomFilter = (value: string) =>
    updateParams((next) => {
      if (value) next.set("roomId", value);
      else next.delete("roomId");

      next.delete("sensorId");
      next.delete("page");
    });

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const goToPage = (nextPage: number) =>
    updateParams((next) => next.set("page", String(nextPage)));

  const totalPages = meta?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [totalPages, page, setSearchParams]);

  const columns: DataTableColumn<SensorReading>[] = [
    {
      header: "Momento da Leitura",
      align: "left",
      width: "25%",
      render: (reading) => (
        <span className="font-medium text-ink">
          {formatDateTime(reading.recordedAt)}
        </span>
      ),
    },
    {
      header: "Sala",
      align: "center",
      width: "25%",
      render: (reading) => (
        <span className="text-ink-soft">{reading.roomName ?? "—"}</span>
      ),
    },
    {
      header: "Sensor",
      align: "center",
      width: "20%",
      render: (reading) => (
        <span className="text-ink-soft">{reading.sensorIdentifier ?? "—"}</span>
      ),
    },
    {
      header: "Temperatura",
      align: "center",
      width: "15%",
      render: (reading) => (
        <span className="text-ink-soft tabular-nums">
          {formatMeasure(reading.tempValue, "°C")}
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (reading) => (
        <span className="text-ink-soft tabular-nums">
          {formatMeasure(reading.humValue, "%")}
        </span>
      ),
    },
  ];

  return (
    <div className="px-6 py-10 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Leituras</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Leituras realizadas pelos sensores.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Sala"
            placeholder="Todas"
            value={roomId}
            onChange={updateRoomFilter}
            options={rooms.map((room) => ({
              value: room.id,
              label: room.name,
            }))}
          />
          <Select
            label="Sensor"
            placeholder="Todos"
            value={sensorId}
            onChange={(value) => updateFilter("sensorId", value)}
            options={sensorOptions}
          />
          <Input
            label="De"
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={DATE_INPUT_LENGTH}
            value={from}
            error={dateInputError(from)}
            onChange={(event) =>
              updateFilter("from", formatDateInput(event.target.value))
            }
          />
          <Input
            label="Até"
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={DATE_INPUT_LENGTH}
            value={to}
            error={dateInputError(to)}
            onChange={(event) =>
              updateFilter("to", formatDateInput(event.target.value))
            }
          />
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            className="text-xs"
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {isError && readings.length === 0 && (
        <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error.message}
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={readings}
          getRowKey={(reading) => reading.id}
          onPageChange={goToPage}
          pagination={meta}
          isLoading={isLoading}
          skeletonRows={Math.min(PAGE_SIZE, 5)}
          emptyMessage="Nenhuma leitura encontrada para o filtro atual."
        />
      </div>
    </div>
  );
};

export default Readings;

//    const formParam = searchParams.get("filtragem");
//    const isFormOpen = formParam !== null;
//
//    const openForm  = () => updateParams((next) => next.set("filtragem", ""));
//    const closeForm = () => updateParams((next) => next.delete("filtragem"));
//
//    if (isFormOpen) {
//      return <ReadingsForm onCancel={closeForm} />;
//    }
//
//    <Button icon={<Search size={16} strokeWidth={1.8} />} onClick={openForm}>
//      Filtrar
//    </Button>
