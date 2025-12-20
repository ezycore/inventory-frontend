import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { DataTablePagination as PaginationConfig } from "@/types/DataTable";

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
  return (
    <div className="flex items-center justify-between px-2">
      {/* Page Size Selector - Left Aligned */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-muted-foreground">Per page</span>
        <Select
          value={`${paginationState.pageSize}`}
          onValueChange={(value) => {
            onPaginationChange({
              pageIndex: 0,
              pageSize: Number(value),
            });
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={paginationState.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {(pagination?.pageSizeOptions || [5, 10, 20, 30, 50, 100]).map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination Controls - Right Aligned */}
      <div className="flex items-center gap-2 sm:gap-6">
        {/* Page Info */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="whitespace-nowrap">
            {paginationState.pageIndex + 1} of{" "}
            {pagination?.totalPages || table.getPageCount()}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ ...paginationState, pageIndex: 0 })}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPaginationChange({
                ...paginationState,
                pageIndex: (pagination?.totalPages || table.getPageCount()) - 1,
              })
            }
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
