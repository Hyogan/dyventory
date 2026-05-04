"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevKeyRef = useRef<string | null>(null);

  const complete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWidth(100);
    setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 350);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisible(true);
    setWidth(15);
    let w = 15;
    intervalRef.current = setInterval(() => {
      w = Math.min(w + Math.random() * 10, 80);
      setWidth(w);
    }, 400);
  }, []);

  // Detect navigation start via anchor clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Skip if same page
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;
      } catch {
        return;
      }
      start();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [start]);

  // Detect navigation completion
  useEffect(() => {
    const key = `${pathname}?${searchParams}`;
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      return;
    }
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;
    complete();
  }, [pathname, searchParams, complete]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none"
      aria-hidden
    >
      <div
        className="h-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Suspense wrapper required because useSearchParams() opts into dynamic rendering
export function NavigationProgress() {
  return (
    <Suspense>
      <NavigationProgressInner />
    </Suspense>
  );
}
