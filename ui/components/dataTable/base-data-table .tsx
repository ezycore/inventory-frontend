"use client";

import { useState, useEffect } from "react";
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
  selectable = false,
  onSelectionChange,
  searchConfig,
  actions,
  onEdit,
  onDelete,
  onBulkDelete,
  onView,
  pagination,
  isLoading = false,
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
  // Table styling props
  variant = 'default',
  headless = false,
  borderless = false,
  rowSpacing = 'none',
  zebra = false,
  roundedRows = false,
  stickyHeader = false,
  rowBgColor,
}: BaseDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility || {});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
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
  });

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination?.manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    manualPagination: pagination?.manualPagination,
    pageCount: pagination?.manualPagination ? (pagination?.totalPages ?? -1) : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: paginationState,
    },
    globalFilterFn: "includesString",
  });

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const hasSelection = selectedRowsCount > 0;

  const handleBulkDelete = async () => {
    if (!hasSelection) return;

    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
    
    // Use bulk delete API if available
    if (onBulkDelete) {
      const ids = selectedRows.map((row: any) => row._id);
      await onBulkDelete(ids);
    } else {
      // Fallback: delete one by one
      for (const row of selectedRows) {
        await onDelete?.(row);
      }
    }
    
    table.resetRowSelection();
  };

  return (
    <div className={`w-full space-y-6 `}>
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        filterConfig={filterConfig}
        searchConfig={searchConfig}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        selectable={selectable}
        hasSelection={hasSelection}
        selectedRowsCount={selectedRowsCount}
        deletable={!!actions?.deletable}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
        enableColumnVisibility={enableColumnVisibility}
        actionButton={toolbarAction}
        customActions={customActions}        manageColumns={manageColumns}
        onColumnSettingsClick={() => setColumnSettingsOpen(true)}      />

      {/* Table */}
      <DataTableBody
        table={table}
        columns={enhancedColumns}
        isLoading={isLoading}
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
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the selected item."
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
