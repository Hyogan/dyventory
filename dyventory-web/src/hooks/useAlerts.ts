"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppNotification } from "@/types";

const POLL_INTERVAL_MS = 60_000; // 60 seconds

interface UseAlertsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => void;
}

export function useAlerts(): UseAlertsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setNotifications(json.data ?? []);
        }
      } catch {
        // Network error — silently ignore (non-critical)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNotifications();

    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tick]);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return { notifications, unreadCount, loading, markRead, markAllRead, refresh };
}
