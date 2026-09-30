"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { PaginationControls } from "@/ui/components/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  /** Row count across all pages; drives the "Showing 1-20 of 137" readout. */
  total?: number;
  onPageChange: (page: number) => void;
  /** The caller resets to page 1 (and clears any row selection) on change. */
  onLimitChange: (limit: number) => void;
  pageSizes?: number[];
  isFetching?: boolean;
}

/** The page sizes the footer offers unless a list passes its own. */
export const LIST_PAGE_SIZES = [20, 50, 100];

/**
 * Footer shared by the hand-rolled ecommerce list pages (orders, customers,
 * carts, catalog): rows-per-page select, numbered pager, row-range readout.
 *
 * **It is deliberately the same three pieces, in the same order, as
 * `DataTablePagination`** — the same `<PaginationControls>`, the same shadcn
 * `Select`, the same responsive ordering. These pages are hand-rolled tables
 * rather than `DataTable`s only because their rows carry bespoke markup, and a
 * shopkeeper paging the catalog should not be able to tell. It used to render a
 * bare Previous/Next pair with "Page 2 of 9", which meant reaching page 7 of the
 * catalog took five clicks while every other list in the app offered a number to
 * click.
 */
export function ListPagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
  pageSizes = LIST_PAGE_SIZES,
  isFetching = false,
}: ListPaginationProps) {
  const t = useTranslations("common.table");
  const from = (page - 1) * limit + 1;
  const to = total != null ? Math.min(page * limit, total) : page * limit;

  return (
    <div className="flex flex-wrap items-center gap-y-2 px-2">
      <div className="order-1 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("rowsPerPage")}</span>
        <Select
          value={`${limit}`}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={limit} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizes.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFetching ? (
          <span className="text-xs text-muted-foreground">Updating…</span>
        ) : null}
      </div>

      {/* Same responsive dance as the DataTable footer: its own centred row on
          a phone, back inline in the middle from `sm` up. */}
      <PaginationControls
        className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1"
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        canPrevious={page > 1}
        canNext={page < totalPages}
      />

      {total != null ? (
        <div className="order-2 ml-auto text-sm text-muted-foreground sm:order-3 sm:ml-0">
          {t("showing", { from, to, total })}
        </div>
      ) : null}
    </div>
  );
}
