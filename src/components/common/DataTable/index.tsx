import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DataTableColumn<T> = {
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  emptyMessage?: string;
  /**
   * Só na primeira carga (sem nada em cache). Revalidações e mutations
   * otimistas mantêm a lista na tela — nunca mostram placeholder.
   */
  isLoading?: boolean;
  skeletonRows?: number;
};

const alignClass = (align?: "left" | "right" | "center") =>
  align === "right"
    ? "text-right"
    : align === "center"
      ? "text-center"
      : "text-left";

const SkeletonBar: React.FC<{ align?: "left" | "right" | "center" }> = ({
  align,
}) => (
  <span
    className={`flex ${
      align === "right"
        ? "justify-end"
        : align === "center"
          ? "justify-center"
          : "justify-start"
    }`}
  >
    <span className="block h-3.5 w-3/5 animate-pulse rounded-full bg-border" />
  </span>
);

const DataTable = <T,>({
  columns,
  data,
  getRowKey,
  page,
  onPageChange,
  pageSize = 10,
  emptyMessage = "Nenhum item encontrado.",
  isLoading = false,
  skeletonRows = 5,
}: DataTableProps<T>) => {
  // Havendo dados (inclusive os otimistas), a tabela nunca volta ao placeholder.
  const showSkeleton = isLoading && data.length === 0;

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.header}
              style={column.width ? { width: column.width } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            {columns.map((column) => (
              <th
                key={column.header}
                className={`px-6 py-3 font-medium ${alignClass(column.align)}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showSkeleton &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr
                key={`skeleton-${rowIndex}`}
                className="border-b border-border last:border-0"
              >
                {columns.map((column) => (
                  <td key={column.header} className="px-6 py-4">
                    <SkeletonBar align={column.align} />
                  </td>
                ))}
              </tr>
            ))}

          {!showSkeleton &&
            paginatedData.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border last:border-0 hover:bg-surface-hover"
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={`px-6 py-4 ${alignClass(column.align)}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}

          {!showSkeleton && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-sm text-ink-faint"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        {showSkeleton ? (
          <span className="block h-3 w-24 animate-pulse rounded-full bg-border" />
        ) : (
          <p className="text-xs text-ink-faint">
            {data.length === 0
              ? emptyMessage
              : `${start + 1}–${Math.min(start + pageSize, data.length)} de ${data.length}`}
          </p>
        )}

        {!showSkeleton && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
            </button>
            <span className="px-2 text-xs text-ink-soft">
              {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Próxima página"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronRight size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
