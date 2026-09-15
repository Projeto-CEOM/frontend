import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, History, TriangleAlert } from "lucide-react";
import { useAlertsSummary } from "@/api/queries/useAlerts";
import { useReadings, READINGS_MAX_PAGE_SIZE } from "@/api/queries/useReadings";
import { useRooms } from "@/api/queries/useRooms";
import { useSensors } from "@/api/queries/useSensors";
import Button from "@/components/common/Button";
import Select from "@/components/common/Select";
import Tabs, { type TabItem } from "@/components/common/Tabs";
import CategoryBarChart from "@/components/charts/CategoryBarChart";
import ChartCard from "@/components/charts/ChartCard";
import ChartLegend from "@/components/charts/ChartLegend";
import Heatmap from "@/components/charts/Heatmap";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { MAX_SERIES } from "@/components/charts/theme";
import { useNow } from "@/hooks/UseNow";
import { cn } from "@/utils/cn";
import { isAlertViolation } from "@/utils/format";
import LiveStatus from "./LiveStatus";
import RecentAlertsList from "./RecentAlertsList";
import RoomStatusGrid from "./RoomStatusGrid";
import SensorHealthList from "./SensorHealthList";
import SeriesTable from "./SeriesTable";
import {
  complianceByRoom,
  dailySwing,
  excursionHeatmap,
  recentAlerts,
  roomStatuses,
  sensorHealth,
  WEEKDAY_LABELS,
} from "./analytics";
import {
  alertsByRoom,
  buildSensorColors,
  buildSeries,
  formatMeasure,
  isPeriodKey,
  MEASURE_KEYS,
  MEASURES,
  PERIOD_KEYS,
  PERIODS,
  type MeasureKey,
  type PeriodKey,
} from "./series";

const LOOKUP_PARAMS = { page: 1, pageSize: 200 };

const ANCHOR_MS = 5 * 60_000;

const TAB_IDS = ["agora", "historico", "alertas"] as const;
type TabId = (typeof TAB_IDS)[number];

const isTabId = (value: string): value is TabId =>
  (TAB_IDS as readonly string[]).includes(value);

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useNow();

  const roomId = searchParams.get("sala") ?? "";
  const sensorId = searchParams.get("sensor") ?? "";
  const periodParam = searchParams.get("periodo") ?? "";
  const period: PeriodKey = isPeriodKey(periodParam) ? periodParam : "24h";
  const hasScopeFilters = Boolean(roomId || sensorId);

  const tabParam = searchParams.get("aba") ?? "";
  const tab: TabId = isTabId(tabParam) ? tabParam : "agora";

  const anchor = Math.floor(Date.now() / ANCHOR_MS) * ANCHOR_MS;
  const from = new Date(anchor - PERIODS[period].ms).toISOString();

  const scope = {
    ...(roomId && { roomId }),
    ...(sensorId && { sensorId }),
  };

  const readingsQuery = useReadings({
    pageSize: READINGS_MAX_PAGE_SIZE,
    from,
    ...scope,
  });
  const alertsQuery = useAlertsSummary({
    pageSize: READINGS_MAX_PAGE_SIZE,
    from,
    ...scope,
  });

  const { data: roomsPage } = useRooms(LOOKUP_PARAMS);
  const allRooms = roomsPage?.data ?? [];
  const { data: sensorsPage } = useSensors(LOOKUP_PARAMS);
  const sensors = sensorsPage?.data ?? [];

  const readings = readingsQuery.data?.data ?? [];
  const alerts = alertsQuery.data?.data ?? [];

  const readingsTotal = readingsQuery.data?.meta.total ?? 0;
  const isTruncated = readingsTotal > readings.length;

  const sensorColors = buildSensorColors(sensors);
  const sensorById = new Map(sensors.map((sensor) => [sensor.id, sensor]));

  const scopedRooms = roomId
    ? allRooms.filter((room) => room.id === roomId)
    : allRooms;
  const scopedSensors = sensors.filter(
    (sensor) =>
      (!roomId || sensor.roomId === roomId) &&
      (!sensorId || sensor.id === sensorId),
  );

  const sensorOptions = (
    roomId ? sensors.filter((sensor) => sensor.roomId === roomId) : sensors
  ).map((sensor) => ({ value: sensor.id, label: sensor.identifier }));

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const updateRoom = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("sala", value);
    } else {
      next.delete("sala");
    }
    next.delete("sensor");
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sala");
    next.delete("sensor");
    setSearchParams(next);
  };

  const refreshAll = () => {
    readingsQuery.refetch();
    alertsQuery.refetch();
  };

  const formatTick = (time: number) =>
    new Date(time).toLocaleString("pt-BR", {
      ...(period === "24h"
        ? { hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "2-digit" }),
    });

  const formatFullTime = (time: number) =>
    new Date(time).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDay = (time: number) =>
    new Date(time).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  const violations = alerts.filter((alert) =>
    isAlertViolation(alert.alertType),
  ).length;

  const statuses = roomStatuses(readings, scopedRooms, sensorById);
  const health = sensorHealth(readings, scopedSensors, allRooms, now);
  const silentSensors = health.filter((sensor) => sensor.isSilent).length;
  const roomsOutOfRange = statuses.filter(
    (status) => status.hasExcursion,
  ).length;
  const compliance = complianceByRoom(readings, sensorById);
  const heatmapCells = excursionHeatmap(readings, sensorById);
  const alertRows = alertsByRoom(alerts);
  const latestAlerts = recentAlerts(alerts);

  const nowIssues = roomsOutOfRange + silentSensors;
  const tabItems: TabItem[] = [
    {
      id: "agora",
      label: "Agora",
      icon: Activity,
      badge: {
        count: nowIssues,
        tone: "danger",
        title: `${roomsOutOfRange} sala(s) fora da faixa · ${silentSensors} sensor(es) sem envio`,
      },
    },
    { id: "historico", label: "Histórico", icon: History },
    {
      id: "alertas",
      label: "Alertas",
      icon: TriangleAlert,
      badge: {
        count: violations,
        tone: "danger",
        title: `${violations} disparo(s) fora da faixa no período`,
      },
    },
  ];

  const isLoadingReadings = readingsQuery.isLoading;
  const isFetchingReadings = readingsQuery.isFetching && !isLoadingReadings;
  const isLoadingAlerts = alertsQuery.isLoading;
  const isFetchingAlerts = alertsQuery.isFetching && !isLoadingAlerts;

  const renderMeasureCard = (measure: MeasureKey) => {
    const config = MEASURES[measure];
    const { points, series: allSeries } = buildSeries({
      readings,
      measure,
      bucketMs: PERIODS[period].bucketMs,
      colors: sensorColors,
    });

    const series = allSeries.slice(0, MAX_SERIES);
    const hidden = allSeries.length - series.length;

    const onlySensor =
      series.length === 1 ? sensorById.get(series[0].sensorId) : undefined;

    let limits: { min: number; max: number } | null = null;
    if (onlySensor) {
      const min = onlySensor[config.limits.min];
      const max = onlySensor[config.limits.max];

      if (typeof min === "number" && typeof max === "number") {
        limits = { min, max };
      }
    }

    const formatValue = (value: number | null) =>
      value === null ? "—" : formatMeasure(value, measure);

    return (
      <ChartCard
        key={measure}
        title={config.label}
        subtitle={`Média por intervalo · últimas ${PERIODS[period].label}`}
        badge={
          limits ? (
            <span className="rounded-lg bg-surface-hover px-2 py-1 text-[11px] text-ink-soft">
              Faixa {formatMeasure(limits.min, measure)} –{" "}
              {formatMeasure(limits.max, measure)}
            </span>
          ) : undefined
        }
        isLoading={isLoadingReadings}
        isFetching={isFetchingReadings}
        isEmpty={points.length === 0}
        table={
          <SeriesTable
            points={points}
            series={series}
            formatValue={formatValue}
            formatTime={formatFullTime}
          />
        }
      >
        <TimeSeriesChart
          points={points}
          series={series}
          formatValue={formatValue}
          formatTick={formatTick}
          formatFullTime={formatFullTime}
          limits={limits}
        />
        <ChartLegend series={series} />
        {hidden > 0 && (
          <p className="mt-2 text-[11px] text-ink-faint">
            Exibindo {series.length} de {allSeries.length} sensores — filtre por
            sala ou sensor para ver os demais.
          </p>
        )}
      </ChartCard>
    );
  };

  const renderSwingCard = (measure: MeasureKey) => {
    const swings = dailySwing(readings, measure);
    const config = MEASURES[measure];
    const formatAmplitude = (value: number) =>
      `${value.toFixed(config.decimals)}${config.unit}`;

    return (
      <ChartCard
        key={`swing-${measure}`}
        title={`Flutuação diária · ${config.label.toLowerCase()}`}
        subtitle="Diferença entre o maior e o menor valor de cada dia"
        isLoading={isLoadingReadings}
        isFetching={isFetchingReadings}
        isEmpty={swings.length === 0}
        table={
          <div className="max-h-64 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-ink-faint">
                  <th className="px-3 py-2 font-medium">Dia</th>
                  <th className="px-3 py-2 text-right font-medium">Mínima</th>
                  <th className="px-3 py-2 text-right font-medium">Máxima</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Amplitude
                  </th>
                </tr>
              </thead>
              <tbody>
                {swings.map((swing) => (
                  <tr
                    key={swing.day}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2 text-ink-soft tabular-nums">
                      {formatDay(swing.day)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {formatMeasure(swing.min, measure)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {formatMeasure(swing.max, measure)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink tabular-nums">
                      {formatAmplitude(swing.amplitude)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <CategoryBarChart
          orientation="columns"
          data={swings.map((swing) => ({
            label: formatDay(swing.day),
            value: Number(swing.amplitude.toFixed(config.decimals)),
          }))}
          formatValue={formatAmplitude}
        />
      </ChartCard>
    );
  };

  const renderAgoraPanel = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm xl:col-span-2">
        <h3 className="text-sm font-semibold text-ink">Estado por sala</h3>
        <p className="mt-0.5 text-xs text-ink-faint">
          Última leitura de cada sala · salas fora da faixa primeiro
        </p>
        <div className="mt-4">
          <RoomStatusGrid
            statuses={statuses}
            now={now}
            isLoading={isLoadingReadings}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Saúde dos sensores
            </h3>
            <p className="mt-0.5 text-xs text-ink-faint">
              Última comunicação recebida
            </p>
          </div>
          {silentSensors > 0 && (
            <span className="flex shrink-0 items-center gap-2 rounded-lg bg-danger-soft px-2 py-1 text-[11px] font-medium text-danger">
              <TriangleAlert size={12} strokeWidth={2.2} />
              {silentSensors} sem envio
            </span>
          )}
        </div>
        <div className="mt-4">
          <SensorHealthList health={health} isLoading={isLoadingReadings} />
        </div>
      </div>
    </div>
  );

  const renderHistoricoPanel = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {MEASURE_KEYS.map(renderMeasureCard)}
      {MEASURE_KEYS.map(renderSwingCard)}

      <div className="xl:col-span-2">
        <ChartCard
          title="Conformidade por sala"
          subtitle="Percentual das leituras dentro da faixa configurada · pior primeiro"
          isLoading={isLoadingReadings}
          isFetching={isFetchingReadings}
          isEmpty={compliance.length === 0}
          emptyMessage="Nenhuma sala com limites configurados no período."
          table={
            <div className="max-h-64 overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-ink-faint">
                    <th className="px-3 py-2 font-medium">Sala</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Na faixa
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Leituras
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Conformidade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((row) => (
                    <tr
                      key={row.room}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 text-ink-soft">{row.room}</td>
                      <td className="px-3 py-2 text-right text-ink tabular-nums">
                        {row.inRange}
                      </td>
                      <td className="px-3 py-2 text-right text-ink tabular-nums">
                        {row.total}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-ink tabular-nums">
                        {row.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <CategoryBarChart
            data={compliance.map((row) => ({
              label: row.room,
              value: Number(row.percent.toFixed(1)),
            }))}
            domain={[0, 100]}
            formatValue={(value) => `${value}%`}
            minHeight={Math.max(160, compliance.length * 52)}
          />
        </ChartCard>
      </div>
    </div>
  );

  const renderAlertasPanel = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        title="Alertas por sala"
        subtitle={`Disparos registrados · últimas ${PERIODS[period].label}`}
        isLoading={isLoadingAlerts}
        isFetching={isFetchingAlerts}
        isEmpty={alertRows.length === 0}
        emptyMessage="Nenhum alerta no período selecionado."
        table={
          <div className="max-h-64 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-ink-faint">
                  <th className="px-3 py-2 font-medium">Sala</th>
                  <th className="px-3 py-2 text-right font-medium">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {alertRows.map((row) => (
                  <tr
                    key={row.room}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2 text-ink-soft">{row.room}</td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <CategoryBarChart
          data={alertRows.map((row) => ({
            label: row.room,
            value: row.total,
          }))}
        />
      </ChartCard>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-ink">Últimos alertas</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            {alerts.length} no período · {violations} fora da faixa
          </p>
        </div>
        <div className="mt-4">
          <RecentAlertsList
            alerts={latestAlerts}
            now={now}
            isLoading={isLoadingAlerts}
          />
        </div>
      </div>

      <div className="xl:col-span-2">
        <ChartCard
          title="Quando o acervo sai da faixa"
          subtitle="Percentual de leituras fora dos limites por dia da semana e hora"
          isLoading={isLoadingReadings}
          isFetching={isFetchingReadings}
          isEmpty={heatmapCells.every((cell) => cell.total === 0)}
          emptyMessage="Sem leituras com limites configurados no período."
          table={
            <div className="max-h-64 overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-ink-faint">
                    <th className="px-3 py-2 font-medium">Dia</th>
                    <th className="px-3 py-2 font-medium">Hora</th>
                    <th className="px-3 py-2 text-right font-medium">Fora</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Leituras
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapCells
                    .filter((cell) => cell.out > 0)
                    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
                    .map((cell) => (
                      <tr
                        key={`${cell.weekday}-${cell.hour}`}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2 text-ink-soft">
                          {WEEKDAY_LABELS[cell.weekday]}
                        </td>
                        <td className="px-3 py-2 text-ink-soft tabular-nums">
                          {cell.hour}h
                        </td>
                        <td className="px-3 py-2 text-right text-ink tabular-nums">
                          {cell.out}
                        </td>
                        <td className="px-3 py-2 text-right text-ink-soft tabular-nums">
                          {cell.total}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          }
        >
          <Heatmap cells={heatmapCells} rowLabels={WEEKDAY_LABELS} />
        </ChartCard>
      </div>
    </div>
  );

  const panels: Record<TabId, () => ReactNode> = {
    agora: renderAgoraPanel,
    historico: renderHistoricoPanel,
    alertas: renderAlertasPanel,
  };

  return (
    <div className="flex h-full min-h-150 flex-col">
      <div className="shrink-0 px-6 pt-8 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Condições do acervo em tempo real e histórico do período.
            </p>
          </div>
          <LiveStatus
            updatedAt={readingsQuery.dataUpdatedAt}
            isFetching={readingsQuery.isFetching}
            onRefresh={refreshAll}
            now={now}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Período</span>
              <div className="flex rounded-lg border border-border p-0.5">
                {PERIOD_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateParam("periodo", key)}
                    aria-pressed={period === key}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      period === key
                        ? "bg-primary/10 text-primary"
                        : "text-ink-soft hover:bg-surface-hover",
                    )}
                  >
                    {PERIODS[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Sala"
                placeholder="Todas"
                value={roomId}
                onChange={updateRoom}
                options={allRooms.map((room) => ({
                  value: room.id,
                  label: room.name,
                }))}
              />
              <Select
                label="Sensor"
                placeholder="Todos"
                value={sensorId}
                onChange={(value) => updateParam("sensor", value)}
                options={sensorOptions}
              />
            </div>

            {hasScopeFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-sm"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {readingsQuery.isError && readings.length === 0 && (
          <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {readingsQuery.error?.message}
          </p>
        )}

        {isTruncated && (
          <p className="mt-4 rounded-lg bg-surface-hover px-3 py-2 text-xs text-ink-soft">
            O período tem {readingsTotal.toLocaleString("pt-BR")} leituras e a
            busca devolve no máximo{" "}
            {READINGS_MAX_PAGE_SIZE.toLocaleString("pt-BR")} por consulta: os
            painéis usam as mais recentes. Reduza o período ou filtre por sensor
            para uma visão completa.
          </p>
        )}

        <div className="mt-6">
          <Tabs
            items={tabItems}
            active={tab}
            onChange={(id) => updateParam("aba", id)}
            idPrefix="dashboard"
          />
        </div>
      </div>

      <div
        key={tab}
        role="tabpanel"
        id={`dashboard-panel-${tab}`}
        aria-labelledby={`dashboard-tab-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4 md:px-10"
      >
        {panels[tab]()}
      </div>
    </div>
  );
};

export default Dashboard;
