# UI Component System Reference

## Table of Contents

1. [Component Library Structure](#structure)
2. [Core Components](#core)
3. [Data Display Components](#display)
4. [Form Components](#forms)
5. [Layout Components](#layout)
6. [Accessibility Checklist](#a11y)

---

## Component Library Structure {#structure}

```
src/components/
├── ui/                     ← Primitive, reusable, no business logic
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Spinner.tsx
│   ├── Skeleton.tsx
│   └── index.ts            ← Re-export all
├── shared/                 ← Cross-feature, business-aware
│   ├── DataTable.tsx       ← Table + pagination + filters
│   ├── SearchInput.tsx     ← Debounced search
│   ├── StatusBadge.tsx     ← Product/sale status display
│   ├── ConfirmDialog.tsx   ← Reusable confirmation modal
│   └── EmptyState.tsx      ← Empty list states
└── charts/
    ├── SalesChart.tsx
    └── StockChart.tsx
```

### Index re-export pattern

```typescript
// components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Badge, badgeVariants } from "./Badge";
export { Card, CardHeader, CardContent, CardFooter } from "./Card";
export { Table, TableHeader, TableBody, TableRow, TableCell } from "./Table";
export { Modal } from "./Modal";
export { Spinner } from "./Spinner";
export { Skeleton } from "./Skeleton";

// Usage anywhere
import { Button, Badge, Card } from "@/components/ui";
```

---

## Core Components {#core}

### Card

```tsx
// components/ui/Card.tsx
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({ className, children, padding = "md" }: CardProps) {
  return (
    <div className={cn("card", paddings[padding], className)}>{children}</div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-(--text-primary)">
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("", className)}>{children}</div>;
}
```

### Spinner

```tsx
// components/ui/Spinner.tsx
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-current", className ?? "size-5")}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
```

### Skeleton

```tsx
// components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200 dark:bg-gray-700",
        className,
      )}
      aria-hidden="true"
    />
  );
}

// Usage
export function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </Card>
  );
}
```

---

## Data Display Components {#display}

### DataTable (reusable table + pagination)

```tsx
// components/shared/DataTable.tsx
"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  meta?: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  loading,
  emptyMessage = "Aucune donnée",
  meta,
  onPageChange,
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton rows={5} cols={columns.length} />;
  if (!data.length) return <EmptyState message={emptyMessage} />;

  return (
    <div>
      <div className="overflow-x-auto rounded border border-(--border-default)">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-(--border-default)">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 font-medium text-(--text-secondary) text-left",
                    col.align && `text-${col.align}`,
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-default)">
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "px-4 py-3 text-(--text-primary)",
                      col.align && `text-${col.align}`,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String(
                          (row as Record<string, unknown>)[String(col.key)] ??
                            "—",
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
```

### EmptyState

```tsx
// components/shared/EmptyState.tsx
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-(--text-muted)">
        {icon ?? <PackageOpen className="size-12 opacity-40" />}
      </div>
      {title && (
        <h3 className="font-semibold text-(--text-primary)">{title}</h3>
      )}
      <p className="text-sm text-(--text-muted) max-w-xs">{message}</p>
      {action}
    </div>
  );
}
```

### StatusBadge

```tsx
// components/shared/StatusBadge.tsx
import { Badge } from "@/components/ui";

type Status =
  | "active"
  | "archived"
  | "pending"
  | "confirmed"
  | "delivered"
  | "cancelled";

const statusMap: Record<
  Status,
  { label: string; variant: "success" | "warning" | "danger" | "default" }
> = {
  active: { label: "Actif", variant: "success" },
  archived: { label: "Archivé", variant: "default" },
  pending: { label: "En attente", variant: "warning" },
  confirmed: { label: "Confirmé", variant: "success" },
  delivered: { label: "Livré", variant: "success" },
  cancelled: { label: "Annulé", variant: "danger" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, variant } = statusMap[status] ?? {
    label: status,
    variant: "default",
  };
  return <Badge variant={variant}>{label}</Badge>;
}
```

---

## Form Components {#forms}

### Input with label and error

```tsx
// components/ui/Input.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-(--text-muted)">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-danger"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
```

### Modal

```tsx
// components/ui/Modal.tsx
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          "card relative w-full z-10 shadow-xl",
          "starting:opacity-0 starting:scale-95 transition-all duration-200",
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-(--border-default)">
          <h2 id="modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
```

---

## Layout Components {#layout}

### Dashboard Shell

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from "./_components/Sidebar";
import { Header } from "./_components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-(--surface-bg)">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Page Header pattern

```tsx
// components/shared/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        {breadcrumb && (
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-sm text-(--text-muted) mb-1"
          >
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-(--text-primary) transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary)">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-(--text-muted) mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
```

---

## Accessibility Checklist {#a11y}

Always verify these before shipping any component:

### Interactive Elements

- [ ] Every `<button>` has visible focus ring (`focus-visible:ring-2`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Links use `<Link>` or `<a>` — never `<div onClick>`
- [ ] Disabled state communicated via `disabled` attribute AND visually

### Forms

- [ ] Every input has a `<label>` with matching `htmlFor` / `id`
- [ ] Required fields marked with `aria-required` or `required` + visual indicator
- [ ] Errors use `role="alert"` and `aria-describedby`
- [ ] Form submission feedback is announced (use `aria-live` for async feedback)

### Tables

- [ ] `<thead>` with `<th scope="col">` headers
- [ ] Complex tables use `aria-describedby` for captions

### Modals / Dialogs

- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- [ ] Focus trapped inside when open
- [ ] Closes on Escape key
- [ ] Focus returns to trigger on close

### Images

- [ ] Decorative images: `alt=""`
- [ ] Informative images: descriptive `alt` text
- [ ] Always use `next/image` (handles lazy loading, sizing)

### Color & Contrast

- [ ] Text contrast ≥ 4.5:1 (AA standard)
- [ ] Never use color as the only differentiator
- [ ] Dark mode tested
