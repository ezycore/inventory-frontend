"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/ui/lib/utils";

/**
 * Shared pager for the small server-paginated tables embedded in cards / detail
 * panels (customer order history, location stock report, …). Renders the
 * "Showing X–Y of N" line plus a prev / numbered / next control, and only shows
 * itself when there is more than one page. `hasPrev`/`hasNext` are derived from
 * `page`/`totalPages` unless the caller passes explicit flags.
 *
 * List *pages* use the full `DataTable` pager instead — this is only for the
 * lightweight tables that are not backed by a TanStack table instance.
 */
export interface TablePagerProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePager({
  page,
  limit,
  total,
  totalPages,
  hasPrev,
  hasNext,
  onPageChange,
  className,
}: TablePagerProps) {
  const t = useTranslations("common.table");
  if (totalPages <= 1) return null;

  const canPrev = hasPrev ?? page > 1;
  const canNext = hasNext ?? page < totalPages;

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t bg-muted/20 px-4 py-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        {t("showing", {
          from: (page - 1) * limit + 1,
          to: Math.min(page * limit, total),
          total,
        })}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
          pageNum === -1 ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "flex h-8 min-w-[32px] items-center justify-center rounded-md text-sm font-medium transition-colors",
                pageNum === page
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card hover:bg-muted",
              )}
            >
              {pageNum}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Page-number list with `-1` marking an ellipsis; collapses to all pages when ≤ 7. */
function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [1];
  if (current > 3) pages.push(-1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push(-1);
  pages.push(total);
  return pages;
}
