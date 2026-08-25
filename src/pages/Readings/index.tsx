import { Reading } from "@/api/types";
import Button from "@/components/common/Button";
import DataTable, { DataTableColumn } from "@/components/common/DataTable";
import { useSearchParams } from "react-router-dom";
import { useReadings } from "@/api/queries/useReadings";

const PAGE_SIZE = 15;

const Readings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, isLoading, isError, error } = useReadings({
    page,
    pageSize: PAGE_SIZE,
  });
  const readings = data?.data ?? [];
  const meta = data?.meta;

  const columns: DataTableColumn<Reading>[] = [
    {
      header: "Momento da Leitura",
      align: "left",
      width: "25%",
      render: (reading) => (
        <span className="font-medium text-ink">
          {reading?.recordedAt ?
            new Date(reading.recordedAt).toLocaleString(undefined) :
            "-"}
        </span>
      ),
    },
    {
      header: "Sala",
      align: "left",
      width: "25%",
      render: (reading) => (
        <span className="text-ink-soft">
          {reading.roomName ??
            "Sala removida"}
        </span>
      ),
    },
    {
      header: "Sensor",
      align: "center",
      width: "25%",
      render: (reading) => (
        <span className="text-ink-soft">
          {reading.sensorIdentifier ??
            "Sala removida"}
        </span>
      ),
    },
    {
      header: "Temperatura",
      align: "center",
      width: "15%",
      render: (reading) => (
        <span className="text-ink-soft">
          {reading.tempValue + "°C"}
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (reading) => (
        <span className="text-ink-soft">
          {reading.humValue + "%"}
        </span>
      ),
    },
  ];

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Leituras</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Leituras realizadas pelos sensores.
          </p>
        </div>

      </div>

      {/* {isError && sensors.length === 0 && (
        <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error.message}
        </p>
      )} */}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={readings}
          getRowKey={(reading) => reading.id}
          onPageChange={goToPage}
          pagination={meta}
          isLoading={isLoading}
          skeletonRows={Math.min(PAGE_SIZE, 5)}
          emptyMessage="Nenhuma leitura cadastrada ainda."
        />
      </div>
    </div>
  );
};

export default Readings;