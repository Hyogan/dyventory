"use client";

import { useTranslations } from "next-intl";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonsProps {
  /** The export endpoint name: "sales" | "tva" | "stock-forecast" */
  reportType: string;
  /** Query params forwarded to the export handler (from, to, granularity…) */
  params?: Record<string, string>;
  /** Which formats to show. Defaults to CSV + XLSX. */
  formats?: Array<"csv" | "xlsx" | "pdf">;
  className?: string;
}

const FORMAT_CONFIG = {
  csv:  { label: "CSV",   icon: Download,         mime: "text/csv" },
  xlsx: { label: "Excel", icon: FileSpreadsheet,   mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pdf:  { label: "PDF",   icon: FileText,          mime: "application/pdf" },
} as const;

export function ExportButtons({
  reportType,
  params = {},
  formats = ["csv", "xlsx"],
  className,
}: ExportButtonsProps) {
  const t = useTranslations("reports.export");

  const buildUrl = (format: string) => {
    const qs = new URLSearchParams({ ...params, format });
    return `/api/export/${reportType}?${qs.toString()}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {formats.map((format) => {
        const { label, icon: Icon } = FORMAT_CONFIG[format];
        return (
          <a
            key={format}
            href={buildUrl(format)}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-fg-muted hover:bg-surface-hover transition-colors"
          >
            <Icon className="size-3.5" />
            {label}
          </a>
        );
      })}
    </div>
  );
}
