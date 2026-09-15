import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileDown, FileSpreadsheet, FileText, Info } from "lucide-react";
import { useAlerts } from "@/api/queries/useAlerts";
import {
  useReadings,
  useReadingsSummary,
  READINGS_MAX_PAGE_SIZE,
} from "@/api/queries/useReadings";
import { useRooms } from "@/api/queries/useRooms";
import { useSensors } from "@/api/queries/useSensors";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import { cn } from "@/utils/cn";
import {
  DATE_INPUT_LENGTH,
  dateInputError,
  dateInputToISO,
  formatDateInput,
} from "@/utils/format";
import {
  DEFAULT_METRIC_IDS,
  METRICS,
  METRICS_BY_GROUP,
  buildTables,
  metricUnavailableReason,
  summarize,
  type ReportTable,
} from "./metrics";
import {
  downloadCsv,
  downloadPdf,
  downloadSpreadsheet,
  reportFileName,
} from "./exporters";

const LOOKUP_PARAMS = { page: 1, pageSize: 200 };

const formatCell = (value: string | number | null) =>
  value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "number"
      ? value.toLocaleString("pt-BR")
      : value;

const ReportTableView: React.FC<{ table: ReportTable }> = ({ table }) => (
  <section className="break-inside-avoid rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-ink">{table.label}</h3>

    {table.rows.length === 0 ? (
      <p className="mt-3 text-xs text-ink-faint">
        Sem dados para o filtro selecionado.
      </p>
    ) : (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border">
              {table.columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-2 py-2 font-medium uppercase tracking-wide text-ink-muted",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={index} className="border-b border-border/60">
                {table.columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-2 py-1.5 text-ink-soft",
                      column.align === "right"
                        ? "text-right tabular-nums"
                        : "text-left",
                    )}
                  >
                    {formatCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const roomId = searchParams.get("roomId") ?? "";
  const sensorId = searchParams.get("sensorId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const fromISO = dateInputToISO(from);
  const toISO = dateInputToISO(to);

  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_METRIC_IDS);

  const scope = {
    ...(roomId && { roomId }),
    ...(sensorId && { sensorId }),
    ...(fromISO && { from: fromISO }),
    ...(toISO && { to: toISO }),
  };

  const readingsQuery = useReadings({
    pageSize: READINGS_MAX_PAGE_SIZE,
    ...scope,
  });
  const alertsQuery = useAlerts({
    pageSize: READINGS_MAX_PAGE_SIZE,
    ...scope,
  });

  const { data: roomsPage } = useRooms(LOOKUP_PARAMS);
  const rooms = roomsPage?.data ?? [];
  const { data: sensorsPage } = useSensors(LOOKUP_PARAMS);
  const sensors = sensorsPage?.data ?? [];

  const summaryQuery = useReadingsSummary({
    ...(fromISO && { from: fromISO }),
    ...(toISO && { to: toISO }),
    ...(roomId && { roomId }),
    ...(sensorId && { sensorId }),
    granularity: "auto",
  });

  const readings = readingsQuery.data?.data ?? [];
  const alerts = alertsQuery.data?.data ?? [];
  const summaries = summaryQuery.data?.data ?? [];
  const granularity = summaryQuery.data?.meta.granularity ?? "hour";

  const readingsTotal = readingsQuery.data?.meta.total ?? 0;
  const alertsTotal = alertsQuery.data?.meta.total ?? 0;
  const truncated =
    readingsTotal > readings.length || alertsTotal > alerts.length;

  const hasFullRaw = readingsTotal <= readings.length;
  const availability = { hasFullRaw, granularity };

  const isLoading =
    readingsQuery.isLoading || alertsQuery.isLoading || summaryQuery.isLoading;

  const tables = useMemo(
    () =>
      buildTables(
        {
          readings,
          summaries,
          granularity,
          alerts,
          rooms,
          sensors,
          now: Date.now(),
        },
        selectedIds,
        availability,
      ),
    [
      readings,
      summaries,
      granularity,
      alerts,
      rooms,
      sensors,
      selectedIds,
      hasFullRaw,
    ],
  );

  const totals = summarize(alerts);

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
    });

  const updateRoomFilter = (value: string) =>
    updateParams((next) => {
      if (value) next.set("roomId", value);
      else next.delete("roomId");
      next.delete("sensorId");
    });

  const toggleMetric = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const selectAll = () =>
    setSelectedIds(
      METRICS.filter(
        (metric) => metricUnavailableReason(metric, availability) === null,
      ).map((metric) => metric.id),
    );
  const clearAll = () => setSelectedIds([]);

  const fileName = reportFileName(from, to);
  const roomLabel =
    rooms.find((room) => room.id === roomId)?.name ?? "Todas as salas";
  const sensorLabel =
    sensors.find((sensor) => sensor.id === sensorId)?.identifier ??
    "Todos os sensores";
  const periodLabel =
    from || to ? `${from || "início"} até ${to || "hoje"}` : "Todo o histórico";

  const emitidoEm = new Date().toLocaleString("pt-BR");

  const heading = {
    periodo: periodLabel,
    sala: roomLabel,
    sensor: sensorLabel,
    granularidade:
      granularity === "day" ? "Diária (agregada)" : "Horária (agregada)",
    emitidoEm,
    leituras: readings.length,
    alertas: totals.total,
    violacoes: totals.violations,
  };

  const disabled = selectedIds.length === 0 || isLoading;

  return (
    <div className="px-6 py-10 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Relatórios</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Monte o relatório escolhendo o período e quais análises incluir, e
          exporte em Excel ou PDF.
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
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Informações do relatório
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {selectedIds.length} de {METRICS.length} análises selecionadas.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={selectAll} className="text-xs">
              Selecionar todas
            </Button>
            <Button variant="ghost" onClick={clearAll} className="text-xs">
              Limpar
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {METRICS_BY_GROUP.map(({ group, label, metrics }) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                {label}
              </p>
              <div className="flex flex-col gap-1.5">
                {metrics.map((metric) => {
                  const blocked = metricUnavailableReason(metric, availability);

                  return (
                    <label
                      key={metric.id}
                      title={blocked ?? metric.description}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors",
                        blocked
                          ? "cursor-not-allowed border-border bg-surface-hover/40 opacity-60"
                          : selectedIds.includes(metric.id)
                            ? "cursor-pointer border-primary/40 bg-primary/5"
                            : "cursor-pointer border-border hover:bg-surface-hover",
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={Boolean(blocked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
                        checked={selectedIds.includes(metric.id) && !blocked}
                        onChange={() => toggleMetric(metric.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-ink">
                          {metric.label}
                        </span>
                        <span className="block text-[11px] leading-snug text-ink-faint">
                          {blocked ?? metric.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => downloadCsv(fileName, tables)}
            icon={<FileDown size={16} strokeWidth={1.8} />}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => downloadSpreadsheet(fileName, tables)}
            icon={<FileSpreadsheet size={16} strokeWidth={1.8} />}
          >
            Exportar Excel
          </Button>
          <Button
            disabled={disabled}
            onClick={() => downloadPdf(fileName, tables, heading)}
            icon={<FileText size={16} strokeWidth={1.8} />}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {truncated && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface-hover/60 p-4">
          <Info
            size={16}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-ink-muted"
          />
          <p className="text-xs text-ink-soft">
            A API entrega no máximo{" "}
            {READINGS_MAX_PAGE_SIZE.toLocaleString("pt-BR")} registros por
            consulta. O período escolhido tem{" "}
            {readingsTotal.toLocaleString("pt-BR")} leituras e{" "}
            {alertsTotal.toLocaleString("pt-BR")} alertas, então os números
            abaixo consideram apenas os mais recentes. Reduza o intervalo para
            um relatório completo.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">
            Relatório de monitoramento — CEOM
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Período</dt>
              <dd className="font-medium text-ink">{periodLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Sala</dt>
              <dd className="font-medium text-ink">{roomLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Sensor</dt>
              <dd className="font-medium text-ink">{sensorLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Emitido em</dt>
              <dd className="font-medium text-ink">
                {new Date().toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Leituras analisadas</dt>
              <dd className="font-medium text-ink">
                {readings.length.toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Alertas</dt>
              <dd className="font-medium text-ink">
                {totals.total.toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Violações</dt>
              <dd className="font-medium text-ink">
                {totals.violations.toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Análises</dt>
              <dd className="font-medium text-ink">{tables.length}</dd>
            </div>
          </dl>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm text-ink-faint">Carregando dados...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm text-ink-faint">
              Selecione ao menos uma análise para montar o relatório.
            </p>
          </div>
        ) : (
          tables.map((table) => (
            <ReportTableView key={table.id} table={table} />
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
