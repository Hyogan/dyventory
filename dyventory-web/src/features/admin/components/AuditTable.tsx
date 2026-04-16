"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import type { AuditLog, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "secondary";

function methodVariant(method: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    GET: "default",
    POST: "success",
    PUT: "primary",
    PATCH: "secondary",
    DELETE: "danger",
  };
  return map[method] ?? "default";
}

function statusVariant(code: number): BadgeVariant {
  if (code >= 500) return "danger";
  if (code >= 400) return "warning";
  if (code >= 200 && code < 300) return "success";
  return "default";
}

interface AuditTableProps {
  logs: AuditLog[];
  meta: PaginationMeta;
}

function DiffViewer({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <div>
      <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
      <pre className="text-xs bg-surface-muted rounded p-2 overflow-auto max-h-[120px]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function ExpandedRow({ log, before, after }: { log: AuditLog; before: string; after: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-surface-muted/40 border-t border-border">
      <DiffViewer label={before} data={log.old_values} />
      <DiffViewer label={after} data={log.new_values} />
      <div className="text-xs text-fg-muted">
        <span className="font-medium">Route: </span>{log.route ?? "—"}
      </div>
      <div className="text-xs text-fg-muted">
        <span className="font-medium">IP: </span>{log.ip_address ?? "—"}
      </div>
    </div>
  );
}

export function AuditTable({ logs, meta }: AuditTableProps) {
  const t = useTranslations("admin.audit");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "expand",
      header: "",
      width: "w-8",
      render: (log) => (
        <button
          onClick={() => toggle(log.id)}
          className="p-1 text-fg-muted hover:text-fg transition-colors"
        >
          {expanded.has(log.id) ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      ),
    },
    {
      key: "user",
      header: t("fields.user"),
      render: (log) => (
        <span className="text-sm text-fg">{log.user?.name ?? `User #${log.user_id}`}</span>
      ),
    },
    {
      key: "action",
      header: t("fields.action"),
      render: (log) => (
        <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded text-fg">{log.action}</code>
      ),
    },
    {
      key: "entity",
      header: t("fields.entity"),
      render: (log) => (
        <span className="text-sm text-fg-muted">
          {log.entity_type ?? "—"}
          {log.entity_id && <span className="text-xs ml-1">#{log.entity_id}</span>}
        </span>
      ),
    },
    {
      key: "http_method",
      header: t("fields.method"),
      align: "center",
      render: (log) => (
        <Badge variant={methodVariant(log.http_method)}>{log.http_method}</Badge>
      ),
    },
    {
      key: "status_code",
      header: tc("status"),
      align: "center",
      render: (log) => (
        <Badge variant={statusVariant(log.status_code)}>{log.status_code}</Badge>
      ),
    },
    {
      key: "created_at",
      header: t("fields.date"),
      render: (log) => (
        <span className="text-xs text-fg-muted whitespace-nowrap">
          {new Date(log.created_at).toLocaleString("fr-FR")}
        </span>
      ),
    },
  ];

  if (!logs.length) {
    return (
      <div className="card p-8 text-center text-sm text-fg-muted">{t("empty")}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 font-medium text-fg-subtle text-left whitespace-nowrap",
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
            {logs.map((log) => (
              <>
                <tr
                  key={log.id}
                  className={cn(
                    "hover:bg-surface-muted/40 transition-colors cursor-pointer",
                    expanded.has(log.id) && "bg-surface-muted/20",
                  )}
                  onClick={() => toggle(log.id)}
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
                      {col.render ? col.render(log) : String((log as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
                {expanded.has(log.id) && (
                  <tr key={`${log.id}-expanded`}>
                    <td colSpan={columns.length} className="p-0">
                      <ExpandedRow log={log} before={t("before")} after={t("after")} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {meta.last_page > 1 && (
        <div className="flex justify-center">
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md mx-0.5 transition-colors",
                p === meta.current_page
                  ? "bg-primary-600 text-white"
                  : "text-fg-muted hover:bg-surface-muted",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
