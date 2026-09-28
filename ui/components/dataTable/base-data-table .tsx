"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEnhancedColumns } from "./columns";
import { usePaginationState, useDeleteDialog } from "./hooks";
import { DataTableToolbar } from "./toolbar";
import { DataTableBody } from "./table-body";
import { DataTablePagination } from "./pagination";
import { BaseDataTableProps } from "@/types/DataTable";
import { EasyAlertDialog } from "../custom/easy-alert-dialog";
import { ColumnSettingsDialog } from "@/components/shared/column-settings-dialog";

export function BaseDataTable<TData, TValue>({
  columns,
  filterConfig,
  data,
  title,
  selectable = false,
  onSelectionChange,
  actions,
  onEdit,
  onDelete,
  onBulkDelete,
  onView,
  pagination,
  isLoading = false,
  isFetching = false,
  enableSorting = true,
  enableColumnVisibility = false,
  defaultColumnVisibility,
  enableRowHover = true,
  toolbarAction,
  rowClassName,
  customActions,
  manageColumns = false,
  module,
  fullColumns,
  // Server-side sorting props
  manualSorting = false,
  sortingState: externalSortingState,
  onSortingChange: externalOnSortingChange,
  serverSortableFields,
  // Table styling props
  variant = 'default',
  headless = false,
  borderless = false,
  rowSpacing = 'none',
  zebra = false,
  roundedRows = false,
  stickyHeader = false,
  rowBgColor,
  selectionResetKey,
  renderSelectionBar,
  suppressBulkDelete = false,
}: BaseDataTableProps<TData, TValue>) {
  const t = useTranslations("common");
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = manualSorting && externalSortingState ? externalSortingState : internalSorting;
  const setSorting = manualSorting && externalOnSortingChange ? externalOnSortingChange : setInternalSorting;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility || {});
  const [rowSelection, setRowSelection] = useState({});
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  // Custom hooks
  const { paginationState, handlePaginationChange } = usePaginationState(pagination);
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
    openDeleteDialog,
  } = useDeleteDialog(onDelete);

  // Enhanced columns with selection and actions
  const enhancedColumns = useEnhancedColumns({
    columns,
    selectable,
    actions,
    onView,
    onEdit,
    openDeleteDialog,
    customActions,
    serverSortableFields: manualSorting ? serverSortableFields : undefined,
  });

  // Selection is keyed by the row's `_id`, not its position. Keyed by index
  // (TanStack's default) a server-paginated table carried "row 3" from page 1
  // onto page 2 — ticking one product and paging on showed a different product
  // ticked, and a bulk delete removed THAT one. Rows without an `_id` keep the
  // index key, which is all a client-side table ever had.
  //
  // Keyed by id, a tick also survives paging, so selections can be built up
  // across pages. `rowCache` remembers every row seen so far, which is what lets
  // `onSelectionChange` and the per-row delete fallback reach rows that are no
  // longer on screen.
  const rowCache = useRef(new Map<string, TData>());
  const getRowId = (row: TData, index: number) => {
    const id = (row as { _id?: unknown })?._id;
    return id ? String(id) : String(index);
  };
  for (const [index, row] of data.entries()) rowCache.current.set(getRowId(row, index), row);

  // A new filter is a new question: rows picked under the old one may not even
  // match it, and acting on invisible rows is exactly what a merchant would not
  // expect. So a change of `selectionResetKey` clears the selection.
  useEffect(() => {
    setRowSelection({});
  }, [selectionResetKey]);

  const table = useReactTable({
    data,
    getRowId,
    columns: enhancedColumns,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination?.manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: (enableSorting && !manualSorting) ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    manualPagination: pagination?.manualPagination,
    manualSorting,
    pageCount: pagination?.manualPagination ? (pagination?.totalPages ?? -1) : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    },
  });

  const selectedIds = useMemo(
    () =>
      Object.entries(rowSelection as Record<string, boolean>)
        .filter(([, picked]) => picked)
        .map(([id]) => id),
    [rowSelection],
  );
  const selectedRows = useMemo(
    () =>
      selectedIds
        .map((id) => rowCache.current.get(id))
        .filter((row): row is TData => row !== undefined),
    [selectedIds],
  );

  // Notify parent of selection changes — every selected row, on any page.
  useEffect(() => {
    onSelectionChange?.(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows]);

  const selectedRowsCount = selectedIds.length;
  const hasSelection = selectedRowsCount > 0;

  const handleBulkDelete = async () => {
    if (!hasSelection) return;

    // Use bulk delete API if available
    if (onBulkDelete) {
      await onBulkDelete(selectedIds);
    } else {
      // Fallback: delete one by one
      for (const row of selectedRows) {
        await onDelete?.(row);
      }
    }
    
    table.resetRowSelection();
  };

  return (
    <div className={`w-full space-y-4 `}>
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        title={title}
        filterConfig={filterConfig}
        selectable={selectable}
        hasSelection={hasSelection}
        selectedRowsCount={selectedRowsCount}
        deletable={!!actions?.deletable && !suppressBulkDelete}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
        enableColumnVisibility={enableColumnVisibility}
        actionButton={toolbarAction}
        customActions={customActions}        manageColumns={manageColumns}
        onColumnSettingsClick={() => setColumnSettingsOpen(true)}      />

      {renderSelectionBar?.({
        ids: selectedIds,
        count: selectedRowsCount,
        pageRowCount: data.length,
        pageAllSelected: data.length > 0 && table.getIsAllPageRowsSelected(),
        clear: () => table.resetRowSelection(),
      })}

      {/* Table */}
      <DataTableBody
        table={table}
        columns={enhancedColumns}
        // A delete is not an initial load — the rows are still on screen and must stay
        // there, so it rides the overlay spinner instead of replacing the body.
        isLoading={isLoading}
        isFetching={isFetching || isDeleting}
        enableRowHover={enableRowHover}
        rowClassName={rowClassName}
        variant={variant}
        headless={headless}
        borderless={borderless}
        rowSpacing={rowSpacing}
        zebra={zebra}
        roundedRows={roundedRows}
        stickyHeader={stickyHeader}
        rowBgColor={rowBgColor}
      />

      {/* Pagination */}
      <DataTablePagination
        table={table}
        pagination={pagination}
        paginationState={paginationState}
        onPaginationChange={handlePaginationChange}
        selectable={selectable}
        selectedRowsCount={selectedRowsCount}
      />

      {/* Delete Confirmation Dialog */}
      <EasyAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("confirm.title")}
        description={t("confirm.deleteSelectedItem")}
        confirmLabel={t("actions.delete")}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      />

      {/* Column Settings Modal */}
      {manageColumns && module && fullColumns && (
        <ColumnSettingsDialog
          open={columnSettingsOpen}
          onOpenChange={setColumnSettingsOpen}
          columns={fullColumns}
          module={module}
        />
      )}
    </div>
  );
}

// Re-export enhanced CRUD version
export { DataTable as DataTableCrud } from ".";
