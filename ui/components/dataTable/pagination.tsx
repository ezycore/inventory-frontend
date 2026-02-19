import { DataTablePagination as PaginationConfig } from "@/types/DataTable";
import { Table } from "@tanstack/react-table";
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
} from "../select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: PaginationConfig;
  paginationState: { pageIndex: number; pageSize: number };
  onPaginationChange: (updater: any) => void;
  selectable?: boolean;
  selectedRowsCount: number;
}

export function DataTablePagination<TData>({
  table,
  pagination,
  paginationState,
  onPaginationChange,
}: DataTablePaginationProps<TData>) {
  const currentPage = paginationState.pageIndex + 1;
  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || table.getPageCount();
    const pageNumbers = [];
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

  return (
    <div className="flex flex-wrap items-center gap-y-2 px-2">
      {/* Page Size Selector - always order-1 */}
      <div className="flex items-center gap-2 order-1">
        <span className="sm:inline text-sm text-muted-foreground">
          Rows Per page
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
            {(
              pagination?.pageSizeOptions || [1, 2, 5, 10, 20, 30, 50, 100]
            ).map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page numbers
      - small: order-3 + w-full forces its own row, justify-center centers it
      - sm+:   order-2 + flex-1 + w-auto puts it back inline in the middle */}
      <div className="order-3 w-full flex items-center justify-center gap-1 sm:order-2 sm:flex-1 sm:w-auto">
        <button
          onClick={() =>
            onPaginationChange({ ...paginationState, pageIndex: 0 })
          }
          disabled={!table.getCanPreviousPage()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
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
              onClick={() => table.setPageIndex(page as number)}
              className={`min-w-[36px] px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-secondary-foreground" />
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4 text-secondary-foreground" />
        </button>
      </div>

      {/* Total — small: order-2 + ml-auto pins it right on row 1 next to rows-per-page
              sm+:  order-3 + ml-0 sits naturally at the end */}
      <div className="order-2 ml-auto text-sm text-muted-foreground sm:order-3 sm:ml-0">
        {paginationState.pageIndex * paginationState.pageSize + 1}-
        {Math.min(
          (paginationState.pageIndex + 1) * paginationState.pageSize,
          pagination?.totalItems || 0,
        )}{" "}
        of {pagination?.totalItems || 0}
      </div>
    </div>
  );
}
