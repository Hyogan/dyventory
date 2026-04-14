"use client";

import { cn } from "@/lib/utils";

interface StockLevelBarProps {
  current: number;
  initial: number;
  threshold?: number;
  unit?: string;
  className?: string;
}

/**
 * Horizontal progress bar showing current_quantity / initial_quantity.
 * Turns warning-coloured when stock is below threshold.
 */
export function StockLevelBar({
  current,
  initial,
  threshold,
  unit,
  className,
}: StockLevelBarProps) {
  const pct = initial > 0 ? Math.min(100, Math.round((current / initial) * 100)) : 0;
  const isOut = current <= 0;
  const isLow = threshold !== undefined && threshold > 0 && current <= threshold && !isOut;

  return (
    <div className={cn("flex items-center gap-2 min-w-[120px]", className)}>
      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOut && "bg-danger-400",
            isLow && "bg-warning-400",
            !isOut && !isLow && "bg-success-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Value */}
      <span
        className={cn(
          "text-xs tabular-nums shrink-0 w-20 text-right",
          isOut && "text-danger-600 font-medium",
          isLow && "text-warning-600",
          !isOut && !isLow && "text-fg-subtle",
        )}
      >
        {isLow || isOut
          ? Number(current).toFixed(unit === "kg" ? 3 : 0)
          : Number(current).toFixed(unit === "kg" ? 3 : 0)}
        {unit && <span className="ml-0.5 text-fg-muted">{unit}</span>}
      </span>
    </div>
  );
}
