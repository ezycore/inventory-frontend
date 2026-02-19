"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/ui/lib/utils";

interface SimpleTableProps<TData, TValue = any> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  rowClassName?: string | ((row: TData) => string);
}

/**
 * SimpleTable - Lightweight table component for displaying local data
 * 
 * Use this when:
 * - Displaying local state (Zustand, useState, etc.)
 * - No need for API fetching, pagination, or complex filtering
 * - Want a simple, performant table
 * 
 * Use DataTable when:
 * - Need API integration with queries
 * - Need pagination, filtering, sorting
 * - Need CRUD operations
 */
export function SimpleTable<TData, TValue = any>({
  columns,
  data,
  className,
  emptyMessage = "No data available",
  isLoading = false,
  rowClassName,
}: SimpleTableProps<TData, TValue>) {
  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => columns, [columns]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is known to work correctly despite this warning
  const table = useReactTable({
    data,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={
                  typeof rowClassName === "function"
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
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
