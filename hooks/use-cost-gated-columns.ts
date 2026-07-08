// coding-standard: maintained
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PERMISSIONS, useHasPermission } from './use-has-permission';

/** Column keys that carry cost figures across the app's tables. */
const COST_COLUMN_KEYS = ['costPrice'];

/** Drop cost-price columns from a table definition when the user lacks `costs.view`. */
export function useCostGatedColumns<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);

  return useMemo(() => {
    if (canViewCosts) return columns;
    return columns.filter((column) => {
      const key = (column as { accessorKey?: string }).accessorKey ?? column.id ?? '';
      return !COST_COLUMN_KEYS.includes(key);
    });
  }, [columns, canViewCosts]);
}
