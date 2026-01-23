import { useMemo } from "react"
import { useAuthStore } from "@/stores/use-auth-store"
import type { ColumnDef } from "@tanstack/react-table"

/**
 * Hook to filter table columns based on excluded columns from settings
 * @param columns - The full column definitions array
 * @param module - The module name (e.g., 'product', 'brand', 'category')
 * @returns Filtered column definitions array
 */
export function useFilteredColumns<T = any>(
  columns: ColumnDef<T>[],
  module: string
): ColumnDef<T>[] {
  const user = useAuthStore((state) => state.user)
  const excludedColumns = user?.organization?.settings?.excludedColumns?.[module] || []

  return useMemo(() => {
    if (!excludedColumns || excludedColumns.length === 0) {
      return columns
    }

    return columns.filter((column: any) => {
      const columnKey = column.accessorKey || column.id
      return !excludedColumns.includes(columnKey)
    })
  }, [columns, excludedColumns])
}
