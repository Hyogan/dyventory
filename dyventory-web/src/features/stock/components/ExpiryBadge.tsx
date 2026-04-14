"use client";

import { cn } from "@/lib/utils";

interface ExpiryBadgeProps {
  daysUntilExpiry: number | null;
  isExpired: boolean;
  className?: string;
}

export function ExpiryBadge({ daysUntilExpiry, isExpired, className }: ExpiryBadgeProps) {
  if (isExpired) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700",
          className,
        )}
      >
        Expired
      </span>
    );
  }

  if (daysUntilExpiry === null) return null;

  const isUrgent = daysUntilExpiry <= 7;
  const isWarning = daysUntilExpiry <= 30;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        isUrgent && "bg-danger-100 text-danger-700",
        isWarning && !isUrgent && "bg-warning-100 text-warning-700",
        !isWarning && "bg-surface-muted text-fg-muted",
        className,
      )}
    >
      {daysUntilExpiry === 0 ? "Today" : `${daysUntilExpiry}d`}
    </span>
  );
}
