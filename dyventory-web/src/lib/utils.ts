/**
 * src/lib/utils.ts
 *
 * Pure utility functions — no React, no Next.js, no API calls.
 * Safe to import in Server Components, Client Components, and lib files.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ── Tailwind class merging ────────────────────────────────────────────────────

/**
 * Merge Tailwind CSS class names, resolving conflicts correctly.
 * Uses clsx for conditional logic + tailwind-merge for deduplication.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Number & quantity formatting ──────────────────────────────────────────────

/**
 * Format a value as kilograms with exactly 3 decimal places.
 * Used everywhere snail (and other living product) quantities are displayed.
 *
 * @example
 *   formatKg(2.5)   → "2.500 kg"
 *   formatKg("1.2") → "1.200 kg"
 */
export function formatKg(value: number | string): string {
  return `${Number(value).toFixed(3)} kg`;
}

/**
 * Format a quantity with the correct number of decimals for its unit.
 * - kg / g  → 3 decimal places
 * - litre   → 2 decimal places
 * - piece   → 0 decimal places (integer)
 * - other   → 2 decimal places
 *
 * @example
 *   formatQuantity(2.5, 'kg')    → "2.500 kg"
 *   formatQuantity(10, 'piece')  → "10 piece"
 *   formatQuantity(1.5, 'litre') → "1.50 litre"
 */
export function formatQuantity(value: number | string, unit: string): string {
  const num = Number(value);
  switch (unit) {
    case "kg":
    case "g":
      return `${num.toFixed(3)} ${unit}`;
    case "litre":
    case "l":
      return `${num.toFixed(2)} ${unit}`;
    case "piece":
    case "pcs":
      return `${Math.round(num)} ${unit}`;
    default:
      return `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)} ${unit}`;
  }
}

// ── Currency formatting ───────────────────────────────────────────────────────

/**
 * Format a monetary value in XAF (Central African CFA franc).
 * Uses French locale formatting as is standard in Cameroon.
 *
 * @example
 *   formatCurrency(15000)        → "15 000 F CFA"
 *   formatCurrency(1500, 'USD')  → "$1,500"
 */
export function formatCurrency(
  value: number | string,
  currency: string = "XAF",
  locale: string = "fr-CM",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * Format a number with thousand separators (no currency symbol).
 *
 * @example
 *   formatNumber(15000) → "15 000"
 */
export function formatNumber(
  value: number | string,
  locale: string = "fr-CM",
): string {
  return new Intl.NumberFormat(locale).format(Number(value));
}

// ── Date formatting ───────────────────────────────────────────────────────────

/**
 * Format a date value into a human-readable string.
 *
 * @example
 *   formatDate('2025-06-30')  → "30 Jun 2025"
 */
export function formatDate(
  value: string | Date,
  locale: string = "en-GB",
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format a date-time value with both date and time parts.
 *
 * @example
 *   formatDateTime('2025-06-30T14:30:00') → "30 Jun 2025, 14:30"
 */
export function formatDateTime(
  value: string | Date,
  locale: string = "en-GB",
): string {
  return formatDate(value, locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a date as a relative string ("3 days ago", "in 2 days").
 * Falls back to an absolute date string if Intl.RelativeTimeFormat is unavailable.
 *
 * @example
 *   formatRelativeDate('2025-06-27') → "in 3 days"   (if today is 2025-06-24)
 *   formatRelativeDate('2025-06-20') → "4 days ago"  (if today is 2025-06-24)
 */
export function formatRelativeDate(
  value: string | Date,
  locale: string = "en",
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diff = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  ); // days

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diff) < 1)
    return rtf.format(
      Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60)),
      "hour",
    );
  if (Math.abs(diff) < 7) return rtf.format(diff, "day");
  if (Math.abs(diff) < 30) return rtf.format(Math.round(diff / 7), "week");
  if (Math.abs(diff) < 365) return rtf.format(Math.round(diff / 30), "month");
  return rtf.format(Math.round(diff / 365), "year");
}

// ── String helpers ────────────────────────────────────────────────────────────

/**
 * Truncate a string to `max` characters and add an ellipsis if needed.
 *
 * @example
 *   truncate('Giant African Land Snails', 10) → "Giant Afri…"
 */
export function truncate(str: string, max: number = 50): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/**
 * Generate initials from a full name (up to 2 characters).
 *
 * @example
 *   initials('Steve Tchingang') → "ST"
 *   initials('Admin')           → "A"
 */
export function initials(name?: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => (n[0] ?? "").toUpperCase())
    .join("");
}

// export function initials2(data: any): void {
//   console.log(data);
// }
/**
 * Convert a string to a URL-safe slug.
 *
 * @example
 *   slugify('Food — Perishable') → "food-perishable"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric
    .trim()
    .replace(/[\s_-]+/g, "-"); // spaces/underscores → hyphens
}

/**
 * Capitalise the first letter of a string.
 *
 * @example
 *   capitalise('admin') → "Admin"
 */
export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Object helpers ────────────────────────────────────────────────────────────

/**
 * Omit keys from an object.
 *
 * @example
 *   omit({ a: 1, b: 2, c: 3 }, ['b']) → { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result;
}

/**
 * Pick specific keys from an object.
 *
 * @example
 *   pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return Object.fromEntries(
    keys.filter((k) => k in obj).map((k) => [k, obj[k]]),
  ) as Pick<T, K>;
}

// ── Async helpers ─────────────────────────────────────────────────────────────

/**
 * Sleep for N milliseconds.
 * Useful in development for simulating network delay.
 *
 * @example
 *   await sleep(1000); // wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Colour helpers (for urgency indicators) ───────────────────────────────────

/**
 * Return a Tailwind colour class based on days-to-stockout urgency.
 * Used in the forecast table and stock alerts.
 *
 * Red   < 7 days
 * Amber 7–14 days
 * Green > 14 days
 */
export function stockUrgencyClass(daysToStockout: number): string {
  if (daysToStockout < 7) return "text-danger-600";
  if (daysToStockout < 14) return "text-warning-600";
  return "text-success-600";
}

/**
 * Return a Tailwind background class based on expiry days.
 *
 * Red   expired or < 3 days
 * Amber 3–7 days
 * Green > 7 days
 */
export function expiryUrgencyClass(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) return "bg-danger-100 text-danger-700";
  if (daysUntilExpiry < 3) return "bg-danger-50 text-danger-600";
  if (daysUntilExpiry < 7) return "bg-warning-50 text-warning-600";
  return "bg-success-50 text-success-700";
}
