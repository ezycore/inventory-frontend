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
  selectable,
  selectedRowsCount,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        {selectable && (
          <div>
            {selectedRowsCount} of {table.getFilteredRowModel().rows.length} row(s) selected
          </div>
        )}
        {pagination?.totalItems && (
          <div>
            Total: {pagination.totalItems} item(s)
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
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

        {/* Page Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Page {paginationState.pageIndex + 1} of{" "}
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
