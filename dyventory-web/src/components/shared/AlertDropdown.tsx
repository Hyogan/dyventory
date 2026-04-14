"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

interface AlertDropdownProps {
  onClose: () => void;
}

// ── Alert type helpers ────────────────────────────────────────────────────────

function alertIcon(type: string) {
  if (type.includes("expiry") || type.includes("mortality"))
    return <Clock className="size-4 text-danger-500 shrink-0" />;
  if (type.includes("zero") || type.includes("out_of_stock"))
    return <AlertTriangle className="size-4 text-danger-500 shrink-0" />;
  if (type.includes("low"))
    return <AlertTriangle className="size-4 text-warning-500 shrink-0" />;
  return <AlertTriangle className="size-4 text-fg-muted shrink-0" />;
}

function alertMessage(notification: AppNotification): string {
  try {
    const data =
      typeof notification.data === "string"
        ? JSON.parse(notification.data)
        : notification.data;
    return data?.message ?? notification.type;
  } catch {
    return notification.type;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AlertDropdown({ onClose }: AlertDropdownProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useAlerts();

  // Click-away close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-fg">{t("notifications")}</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-danger-500 text-white text-xs font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-fg-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-fg-muted">
            <CheckCircle2 className="size-8 text-success-400" />
            <p className="text-sm">{t("noNotifications")}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted border-b border-border/50 last:border-0",
                !n.read_at && "bg-primary-50/40",
              )}
            >
              {alertIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-fg leading-snug">{alertMessage(n)}</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : ""}
                </p>
              </div>
              {!n.read_at && (
                <span className="size-2 rounded-full bg-primary-500 shrink-0 mt-1" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
