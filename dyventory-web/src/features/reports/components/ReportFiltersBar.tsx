"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReportFiltersBarProps {
  /** Show granularity selector (day/week/month/quarter/year) */
  showGranularity?: boolean;
}

type Granularity = "day" | "week" | "month" | "quarter" | "year";

const GRANULARITIES: Granularity[] = ["day", "week", "month", "quarter", "year"];

function thisMonth() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function lastMonth() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const to   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  return { from, to };
}

function thisYear() {
  const now = new Date();
  return {
    from: `${now.getFullYear()}-01-01`,
    to:   `${now.getFullYear()}-12-31`,
  };
}

export function ReportFiltersBar({ showGranularity = true }: ReportFiltersBarProps) {
  const t  = useTranslations("reports.filters");
  const tg = useTranslations("reports.granularity");
  const tp = useTranslations("reports.periods");

  const router     = useRouter();
  const pathname   = usePathname();
  const sp         = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const defaults = thisMonth();
  const [from, setFrom]             = useState(sp.get("from") ?? defaults.from);
  const [to, setTo]                 = useState(sp.get("to")   ?? defaults.to);
  const [granularity, setGranularity] = useState<Granularity>(
    (sp.get("granularity") as Granularity) ?? "month",
  );

  const applyPreset = (preset: { from: string; to: string }) => {
    setFrom(preset.from);
    setTo(preset.to);
  };

  const apply = () => {
    startTransition(() => {
      const params = new URLSearchParams(sp.toString());
      params.set("from", from);
      params.set("to", to);
      if (showGranularity) params.set("granularity", granularity);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => applyPreset(thisMonth())}
          className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-surface-hover text-fg-muted transition-colors"
        >
          {tp("month")}
        </button>
        <button
          onClick={() => applyPreset(lastMonth())}
          className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-surface-hover text-fg-muted transition-colors"
        >
          {tp("custom")} (last month)
        </button>
        <button
          onClick={() => applyPreset(thisYear())}
          className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-surface-hover text-fg-muted transition-colors"
        >
          {tp("year")}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* From */}
        <div>
          <label className="block text-xs font-medium text-fg-muted mb-1">{t("from")}</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input h-8 text-sm px-2"
          />
        </div>

        {/* To */}
        <div>
          <label className="block text-xs font-medium text-fg-muted mb-1">{t("to")}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input h-8 text-sm px-2"
          />
        </div>

        {/* Granularity */}
        {showGranularity && (
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">{t("granularity")}</label>
            <div className="flex gap-1">
              {GRANULARITIES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    granularity === g
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-border text-fg-muted hover:bg-surface-hover",
                  )}
                >
                  {tg(g)}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button size="sm" onClick={apply} loading={isPending} className="h-8">
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}
