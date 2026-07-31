import { RowSpacing, TableVariant } from "@/types/DataTable";
import { cn } from "@/ui/lib/utils";
import {
  ColumnDef,
  flexRender,
  Table as TanStackTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

interface DataTableBodyProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  isFetching?: boolean;
  enableRowHover?: boolean;
  rowClassName?: string | ((row: TData) => string);
  /** Table styling props */
  variant?: TableVariant;
  headless?: boolean;
  borderless?: boolean;
  rowSpacing?: RowSpacing;
  zebra?: boolean;
  roundedRows?: boolean;
  stickyHeader?: boolean;
  rowBgColor?: string | ((row: TData) => string);
}

// Variant-based cell padding
const variantStyles: Record<TableVariant, string> = {
  default: "",
  compact: "[&_td]:py-2 [&_th]:py-2 text-sm",
  relaxed: "[&_td]:py-5 [&_th]:py-4",
  card: "[&_td]:py-4 [&_th]:py-3",
};

// Row spacing styles
const rowSpacingStyles: Record<RowSpacing, string> = {
  none: "",
  sm: "border-spacing-y-1",
  md: "border-spacing-y-2",
  lg: "border-spacing-y-3",
};

export function DataTableBody<TData, TValue>({
  table,
  columns,
  isLoading,
  isFetching,
  enableRowHover,
  rowClassName,
  variant = "default",
  headless = false,
  borderless = false,
  rowSpacing = "none",
  zebra = false,
  roundedRows = false,
  stickyHeader = false,
  rowBgColor,
}: DataTableBodyProps<TData, TValue>) {
  const t = useTranslations("common.table");
  // Calculate row background color
  const getRowBgColor = (row: TData): string => {
    if (typeof rowBgColor === "function") {
      return rowBgColor(row);
    }
    return rowBgColor || "";
  };

  // Build wrapper classes. No outer chrome — the table sits flush on whatever
  // surface hosts it; the page's own Card supplies any framing. `borderless`
  // still controls the row/cell borders below.
  const wrapperClasses = cn(
    "overflow-hidden",
    stickyHeader && "max-h-[600px] overflow-y-auto",
  );

  // Build table classes
  const tableClasses = cn(
    variantStyles[variant],
    rowSpacing !== "none" && `border-separate ${rowSpacingStyles[rowSpacing]}`,
  );

  // Build header classes
  const headerClasses = cn(stickyHeader && "sticky top-0 z-10 bg-background");

  // Build row classes for a specific row
  const getRowClasses = (row: TData, index: number, isSelected: boolean) => {
    return cn(
      // Base row background
      getRowBgColor(row),
      // Zebra striping
      zebra && index % 2 === 1 && "bg-muted/30",
      // Rounded rows (only works with border-separate)
      roundedRows &&
        rowSpacing !== "none" &&
        "[&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md",
      // Row shadow for spacing mode
      rowSpacing !== "none" && "shadow-sm bg-background",
      // Hover effect
      enableRowHover && "hover:bg-muted/50 transition-colors",
      // Selection state
      isSelected && "bg-muted",
      // Custom row class
      typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
    );
  };

  // Build cell classes
  const cellClasses = cn(
    borderless && "border-0",
    roundedRows &&
      rowSpacing !== "none" &&
      "border-y first:border-l last:border-r",
  );

  return (
    <div className={cn(wrapperClasses, "relative")}>
      {/* Overlay spinner for sort/filter/pagination refetches — keeps existing rows visible */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      )}
      <Table className={tableClasses}>
        {/* Table Header - hidden when headless */}
        {!headless && (
          <TableHeader className={headerClasses}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={borderless ? "border-0" : ""}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={borderless ? "border-0" : ""}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-2 cursor-pointer select-none"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-2">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-4 w-4 rotate-180" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={getRowClasses(
                  row.original,
                  index,
                  row.getIsSelected(),
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cellClasses}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t("noResults")}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
