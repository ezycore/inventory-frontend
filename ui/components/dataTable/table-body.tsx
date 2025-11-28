import { flexRender, Table as TanStackTable, ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, Search } from "lucide-react";
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
  enableRowHover?: boolean;
  rowClassName?: string | ((row: TData) => string);
}

export function DataTableBody<TData, TValue>({
  table,
  columns,
  isLoading,
  enableRowHover,
  rowClassName,
}: DataTableBodyProps<TData, TValue>) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={
                  enableRowHover
                    ? `${
                        typeof rowClassName === "function"
                          ? rowClassName(row.original)
                          : rowClassName || ""
                      } hover:bg-muted/50 transition-colors`
                    : typeof rowClassName === "function"
                    ? rowClassName(row.original)
                    : rowClassName
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
                  <p>No results found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
