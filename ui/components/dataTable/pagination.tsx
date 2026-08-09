import { DataTablePagination as PaginationConfig } from "@/types/DataTable";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { PaginationControls } from "../pagination-controls";
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
  const t = useTranslations("common.table");
  const currentPage = paginationState.pageIndex + 1;
  // Server-paginated tables get their count from the API; client-side ones from
  // the row model. Unchanged — the window logic moved to `utils/page-window.ts`
  // so the ecommerce list pages could render the identical pager.
  const totalPages = pagination?.totalPages || table.getPageCount();

  return (
    <div className="flex flex-wrap items-center gap-y-2 px-2">
      {/* Page Size Selector - always order-1 */}
      <div className="flex items-center gap-2 order-1">
        <span className="sm:inline text-sm text-muted-foreground">
          {t("rowsPerPage")}
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
      <PaginationControls
        className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1"
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(next) => table.setPageIndex(next - 1)}
        // From the table, not derived from `totalPages` — the two can disagree
        // on a server-paginated table, and this is the answer that has always
        // driven these buttons.
        canPrevious={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
      />

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
