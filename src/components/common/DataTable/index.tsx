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
};

const DataTable = <T,>({
  columns,
  data,
  getRowKey,
  page,
  onPageChange,
  pageSize = 10,
  emptyMessage = "Nenhum item encontrado.",
}: DataTableProps<T>) => {
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
                className={`px-6 py-3 font-medium ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border last:border-0 hover:bg-surface-hover"
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-6 py-4 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}

          {data.length === 0 && (
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
        <p className="text-xs text-ink-faint">
          {data.length === 0
            ? emptyMessage
            : `${start + 1}–${Math.min(start + pageSize, data.length)} de ${data.length}`}
        </p>

        {totalPages > 1 && (
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
