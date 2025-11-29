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
import { DeleteDialog } from "./delete-dialog";
import { DataTableProps } from "@/types/DataTable";

export function DataTable<TData, TValue>({
  columns,
  data,
  selectable = false,
  onSelectionChange,
  searchConfig,
  actions,
  onEdit,
  onDelete,
  onView,
  pagination,
  isLoading = false,
  enableSorting = true,
  enableColumnVisibility = true,
  defaultColumnVisibility,
  enableRowHover = true,
  toolbarAction,
  className,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility || {});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

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
    for (const row of selectedRows) {
      await onDelete?.(row);
    }
    table.resetRowSelection();
  };

  return (
    <div className={`w-full space-y-4 ${className || ""}`}>
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
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
      />

      {/* Table */}
      <DataTableBody
        table={table}
        columns={enhancedColumns}
        isLoading={isLoading}
        enableRowHover={enableRowHover}
        rowClassName={rowClassName}
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
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
