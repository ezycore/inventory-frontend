"use client";
// coding-standard: maintained

import { Button } from "@/ui/components/button";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  /** The caller resets to page 1 (and clears any row selection) on change. */
  onLimitChange: (limit: number) => void;
  pageSizes?: number[];
  isFetching?: boolean;
}

/** Footer shared by the hand-rolled ecommerce list pages (orders, customers,
 *  catalog): rows-per-page select, fetch indicator, Previous/Next paging. */
export function ListPagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  pageSizes = [20, 50, 100],
  isFetching = false,
}: ListPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {isFetching && <span className="text-xs">Updating…</span>}
      </div>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
