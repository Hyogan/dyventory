"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { PaginationMeta } from "@/types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page, from, to, total } = meta;

  const pages = getPageNumbers(current_page, last_page);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Count info */}
      <p className="text-sm text-fg-muted shrink-0">
        {from !== null && to !== null
          ? `Showing ${from}–${to} of ${total}`
          : `${total} total`}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(current_page - 1)}
          disabled={current_page <= 1}
          aria-label="Previous page"
          icon={<ChevronLeft className="size-4" />}
        />

        {pages.map((page, i) =>
          page === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-fg-muted text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange?.(page as number)}
              className={cn(
                "h-8 w-8 text-sm rounded font-medium transition-colors",
                page === current_page
                  ? "bg-primary-500 text-white"
                  : "text-fg-subtle hover:bg-surface-muted",
              )}
              aria-current={page === current_page ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(current_page + 1)}
          disabled={current_page >= last_page}
          aria-label="Next page"
          icon={<ChevronRight className="size-4" />}
        />
      </div>
    </div>
  );
}

function getPageNumbers(current: number, last: number): (number | "...")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", last);
  } else if (current >= last - 3) {
    pages.push(1, "...", last - 4, last - 3, last - 2, last - 1, last);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", last);
  }

  return pages;
}
