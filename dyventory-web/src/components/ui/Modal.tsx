"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  /** Content for the footer area (e.g. action buttons) */
  footer?: React.ReactNode;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus trap — focus first focusable element
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
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
          "card relative w-full z-10 shadow-xl flex flex-col max-h-[90vh]",
          sizes[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold text-fg"
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="text-sm text-fg-muted mt-0.5"
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-muted transition-colors text-fg-muted hover:text-fg ml-4 shrink-0"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
