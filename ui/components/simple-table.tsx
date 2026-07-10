// coding-standard: maintained
import * as React from "react"

import { cn } from "@ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table"

export interface SimpleColumn<T> {
  /** Stable column id — used as the React key for header + body cells. */
  key: string
  /** Header cell content (string or node, e.g. a select-all checkbox). */
  header: React.ReactNode
  /** Render one body cell for a row. */
  cell: (row: T) => React.ReactNode
  /** Shorthand alignment applied to both the header and body cells. */
  align?: "left" | "right" | "center"
  /** Extra class on the header cell (widths, sizing, etc.). */
  headClassName?: string
  /** Extra class on every body cell in this column. */
  cellClassName?: string
}

export interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[]
  rows: T[]
  /** React key per row. */
  getRowKey: (row: T, index: number) => React.Key
  /** Per-row class on the <tr> (e.g. dimmed/disabled rows). */
  rowClassName?: (row: T) => string | undefined
  /** Class on the header <tr>. */
  headerRowClassName?: string
  /** Class on the underlying <table>. */
  className?: string
  /** Makes rows clickable: pointer cursor + Enter/Space keyboard activation. */
  onRowClick?: (row: T) => void
}

const alignClass = {
  left: "",
  right: "text-right",
  center: "text-center",
} as const

/**
 * Lightweight, column-driven table for the small tables embedded inside cards
 * and detail panels. For full list pages that need pagination / search /
 * row-selection, use the DataTable in `ui/components/dataTable` instead.
 */
export function SimpleTable<T>({
  columns,
  rows,
  getRowKey,
  rowClassName,
  headerRowClassName,
  className,
  onRowClick,
}: SimpleTableProps<T>) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className={headerRowClassName}>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(col.align && alignClass[col.align], col.headClassName)}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow
            key={getRowKey(row, index)}
            className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onRowClick(row)
                    }
                  }
                : undefined
            }
          >
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(col.align && alignClass[col.align], col.cellClassName)}
              >
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
