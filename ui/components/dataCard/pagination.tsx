"use client";

import { DataCardPagination as PaginationConfig } from "@/types/DataCard";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { cn } from "@/ui/lib/utils";

interface DataCardPaginationProps {
  pagination?: PaginationConfig;
  paginationState: { pageIndex: number; pageSize: number };
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  selectable?: boolean;
  selectedRowsCount?: number;
  totalItems?: number;
}

export function DataCardPagination({
  pagination,
  paginationState,
  onPaginationChange,
  totalItems = 0,
}: DataCardPaginationProps) {
  const currentPage = paginationState.pageIndex + 1;
  const totalPages = pagination?.totalPages || Math.ceil(totalItems / paginationState.pageSize) || 1;

  const canPreviousPage = pagination?.hasPrev ?? currentPage > 1;
  const canNextPage = pagination?.hasNext ?? currentPage < totalPages;

  const goToPage = (pageIndex: number) => {
    onPaginationChange({ ...paginationState, pageIndex });
  };

  const goToPreviousPage = () => {
    if (canPreviousPage) {
      goToPage(paginationState.pageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (canNextPage) {
      goToPage(paginationState.pageIndex + 1);
    }
  };

  const goToFirstPage = () => goToPage(0);
  const goToLastPage = () => goToPage(totalPages - 1);

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (startPage > 1) {
      pageNumbers.unshift(1);
      if (startPage > 2) {
        pageNumbers.splice(1, 0, "...");
      }
    }

    if (endPage < totalPages) {
      pageNumbers.push(totalPages);
      if (endPage < totalPages - 1) {
        pageNumbers.splice(pageNumbers.length - 1, 0, "...");
      }
    }
    return pageNumbers;
  };

  if (totalPages <= 1 && !pagination?.manualPagination) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-y-2 px-2">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2 order-1">
        <span className="sm:inline text-sm text-muted-foreground">
          Items per page
        </span>
        <Select
          value={`${paginationState.pageSize}`}
          onValueChange={(value) => {
            onPaginationChange({ pageIndex: 0, pageSize: Number(value) });
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={paginationState.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {(pagination?.pageSizeOptions || [10, 20, 30, 50, 100]).map(
              (pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Page Numbers */}
      <div className="order-3 w-full flex items-center justify-center gap-1 sm:order-2 sm:flex-1 sm:w-auto">
        <button
          onClick={goToFirstPage}
          disabled={!canPreviousPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <button
          onClick={goToPreviousPage}
          disabled={!canPreviousPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-secondary-foreground" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-1.5 text-gray-400 select-none"
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => goToPage((page as number) - 1)}
              className={cn(
                "min-w-[36px] px-3 py-1.5 text-sm rounded-lg transition-colors",
                currentPage === page
                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={goToNextPage}
          disabled={!canNextPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-secondary-foreground" />
        </button>
        <button
          onClick={goToLastPage}
          disabled={!canNextPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4 text-secondary-foreground" />
        </button>
      </div>

      {/* Total Items Info */}
      <div className="hidden sm:flex items-center gap-2 order-2 sm:order-3">
        <span className="text-sm text-muted-foreground">
          {paginationState.pageIndex * paginationState.pageSize + 1}-

          {Math.min(
            (paginationState.pageIndex + 1) * paginationState.pageSize,
            pagination?.totalItems || 0,
          )}{" "}
          of {pagination?.totalItems || 0}
        </span>
      </div>
    </div>
  );
}
