"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { pageWindow } from "@/utils/page-window";
import { cn } from "@/ui/lib/utils";

/**
 * First / prev / numbered pages / next / last — the app's one paging control.
 *
 * `DataTablePagination` renders it, and so does the ecommerce list pages'
 * `ListPagination`; those pages are hand-rolled tables rather than `DataTable`s,
 * and until this existed they got a bare Previous/Next pair, so the catalog and
 * orders screens paged differently from every other list in the product.
 *
 * `canPrevious`/`canNext` are **passed in, not derived** from `page` and
 * `totalPages`. A server-paginated `DataTable` answers those from TanStack's own
 * row model, which can disagree with a `totalPages` the API supplied; deriving
 * them here would quietly change that behaviour for every table in the app.
 */
export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  canPrevious,
  canNext,
  className,
}: {
  /** 1-based. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canPrevious: boolean;
  canNext: boolean;
  className?: string;
}) {
  const t = useTranslations("common.table");
  const slots = pageWindow(page, totalPages);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <StepButton
        label={t("firstPage")}
        disabled={!canPrevious}
        onClick={() => onPageChange(1)}
      >
        <ChevronsLeft className="h-4 w-4 text-secondary-foreground" />
      </StepButton>
      <StepButton
        label={t("previousPage")}
        disabled={!canPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4 text-secondary-foreground" />
      </StepButton>

      {slots.map((slot, i) =>
        slot === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="select-none px-3 py-1.5 text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            onClick={() => onPageChange(slot)}
            aria-current={slot === page ? "page" : undefined}
            aria-label={t("goToPage", { page: slot })}
            className={cn(
              "min-w-[36px] cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors",
              slot === page
                ? "bg-primary font-medium text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted",
            )}
          >
            {slot}
          </button>
        ),
      )}

      <StepButton
        label={t("nextPage")}
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4 text-secondary-foreground" />
      </StepButton>
      <StepButton
        label={t("lastPage")}
        disabled={!canNext}
        onClick={() => onPageChange(totalPages)}
      >
        <ChevronsRight className="h-4 w-4 text-secondary-foreground" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
