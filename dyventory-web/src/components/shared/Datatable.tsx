"use client";

import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { PaginationMeta } from "@/types";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  loading,
  emptyTitle,
  emptyMessage = "No data to display.",
  meta,
  onPageChange,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} cols={columns.length} />;
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={cn("space-y-4 min-h-[200px]", className)}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/70 border-b-2 border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-fg-muted text-left whitespace-nowrap",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-primary-50/30 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-fg",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String(
                          (row as Record<string, unknown>)[col.key] ?? "—",
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <Pagination meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}
