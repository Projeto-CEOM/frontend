import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useAlerts } from "@/api/queries/useAlerts";
import { useRooms } from "@/api/queries/useRooms";
import { useSensors } from "@/api/queries/useSensors";
import type { AlertFamily, AlertLog } from "@/api/alerts";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import { cn } from "@/utils/cn";
import {
  DATE_INPUT_LENGTH,
  dateInputError,
  dateInputToISO,
  formatAlertType,
  formatAlertValue,
  formatDateInput,
  formatDateTime,
  isAlertViolation,
} from "@/utils/format";
import Button from "@/components/common/Button";

const PAGE_SIZE = 10;

const LOOKUP_PARAMS = { page: 1, pageSize: 200 };

const TYPE_OPTIONS: { value: AlertFamily; label: string }[] = [
  { value: "temperature", label: "Temperatura" },
  { value: "humidity", label: "Umidade" },
];

const Alerts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const roomId = searchParams.get("roomId") ?? "";
  const sensorId = searchParams.get("sensorId") ?? "";
  const type = searchParams.get("type") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const fromISO = dateInputToISO(from);
  const toISO = dateInputToISO(to);

  const { data, isLoading, isError, error } = useAlerts({
    page,
    pageSize: PAGE_SIZE,
    ...(roomId && { roomId }),
    ...(sensorId && { sensorId }),
    ...(type && { type: type as AlertFamily }),
    ...(fromISO && { from: fromISO }),
    ...(toISO && { to: toISO }),
  });
  const alerts = data?.data ?? [];
  const meta = data?.meta;

  const { data: roomsPage } = useRooms(LOOKUP_PARAMS);
  const rooms = roomsPage?.data ?? [];
  const { data: sensorsPage } = useSensors(LOOKUP_PARAMS);
  const sensors = sensorsPage?.data ?? [];

  const sensorOptions = (
    roomId ? sensors.filter((sensor) => sensor.roomId === roomId) : sensors
  ).map((sensor) => ({ value: sensor.id, label: sensor.identifier }));

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const updateRoomFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("roomId", value);
    } else {
      next.delete("roomId");
    }
    next.delete("sensorId");
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

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

  const columns: DataTableColumn<AlertLog>[] = [
    {
      header: "Data/hora",
      align: "left",
      width: "10%",
      render: (alert) => (
        <span className="text-ink-soft">
          {formatDateTime(alert.triggeredAt)}
        </span>
      ),
    },
    {
      header: "Sala",
      align: "center",
      width: "20%",
      render: (alert) => (
        <span className="text-ink-soft">{alert.roomName ?? "—"}</span>
      ),
    },
    {
      header: "Sensor",
      align: "center",
      width: "15%",
      render: (alert) => (
        <span className="text-ink-soft">{alert.sensorIdentifier ?? "—"}</span>
      ),
    },
    {
      header: "Tipo",
      align: "center",
      width: "15%",
      render: (alert) => {
        const violation = isAlertViolation(alert.alertType);
        const Icon = violation ? TriangleAlert : CircleCheck;

        return (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 font-medium justify-center",
              violation
                ? "bg-danger-soft text-danger"
                : "bg-primary/15 text-primary",
            )}
          >
            <Icon size={16} strokeWidth={2.2} />
            {formatAlertType(alert.alertType)}
          </span>
        );
      },
    },
    {
      header: "Valor",
      align: "center",
      width: "10%",
      render: (alert) => (
        <span className="text-ink-soft">
          {formatAlertValue(alert.alertType, alert.value)}
        </span>
      ),
    },
    {
      header: "Mensagem",
      align: "center",
      width: "30%",
      render: (alert) => (
        <span className="line-clamp-2 text-ink-soft text-justify">
          {alert.message ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="px-6 py-10 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Alertas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Histórico de leituras que romperam os limites configurados de
          temperatura e umidade.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <Select
            label="Tipo"
            placeholder="Todos"
            value={type}
            onChange={(value) => updateFilter("type", value)}
            options={TYPE_OPTIONS}
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
            onClick={() => clearFilters()}
            className="text-xs"
            children="Limpar filtros"
          />
        </div>
      </div>

      {isError && alerts.length === 0 && (
        <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error.message}
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={alerts}
          getRowKey={(alert) => alert.id}
          onPageChange={goToPage}
          pagination={meta}
          isLoading={isLoading}
          skeletonRows={Math.min(PAGE_SIZE, 5)}
          emptyMessage="Nenhum alerta registrado."
        />
      </div>
    </div>
  );
};

export default Alerts;
