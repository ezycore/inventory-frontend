"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import {
  ChevronDown,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface DataTableAction {
  deletable?: boolean | { tooltip?: string };
  editable?: boolean | { tooltip?: string };
  viewable?: boolean | { tooltip?: string };
  custom?: Array<{
    label: string;
    icon?: React.ReactNode;
    tooltip?: string;
    onClick: (row: any) => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }>;
}

export interface DataTablePagination {
  pageIndex: number;
  pageSize: number;
  totalPages?: number;
  totalItems?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  manualPagination?: boolean;
  pageSizeOptions?: number[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  
  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  
  // Search
  searchConfig?: {
    searchableColumn?: keyof TData;
    placeholder?: string;
    globalSearch?: boolean; // Search across all columns
  };
  
  // Actions
  actions?: DataTableAction;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void | Promise<void>;
  onView?: (row: TData) => void;
  
  // Pagination
  pagination?: DataTablePagination;
  
  // Loading state
  isLoading?: boolean;
  
  // Additional features
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  enableRowHover?: boolean;
  
  // Styling
  className?: string;
  rowClassName?: string | ((row: TData) => string);
}

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
  enableRowHover = true,
  className,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<TData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination?.pageIndex ?? 0,
    pageSize: pagination?.pageSize ?? 10,
  });

  // Sync pagination state with props
  useEffect(() => {
    if (pagination?.pageIndex !== undefined) {
      setPaginationState((prev) => ({ ...prev, pageIndex: pagination.pageIndex }));
    }
  }, [pagination?.pageIndex]);

  useEffect(() => {
    if (pagination?.pageSize !== undefined) {
      setPaginationState((prev) => ({ ...prev, pageSize: pagination.pageSize }));
    }
  }, [pagination?.pageSize]);

  // Handle pagination change
  const handlePaginationChange = (updater: any) => {
    const newState =
      typeof updater === "function" ? updater(paginationState) : updater;
    setPaginationState(newState);
    pagination?.onPaginationChange?.(newState);
  };

  // Add selection column if selectable
  const enhancedColumns = useMemo(() => {
    const cols = [...columns];
    
    // Add selection column
    if (selectable && !cols.some((col: any) => col.id === "select")) {
      cols.unshift({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={(e) => row.toggleSelected(!!e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }
    
    // Add actions column
    if (actions && !cols.some((col: any) => col.id === "actions")) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <div className="flex items-center gap-2">
              {actions.viewable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeof actions.viewable === "object" && actions.viewable.tooltip
                        ? actions.viewable.tooltip
                        : "View details"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {actions.editable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeof actions.editable === "object" && actions.editable.tooltip
                        ? actions.editable.tooltip
                        : "Edit"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {actions.deletable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRowToDelete(rowData);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeof actions.deletable === "object" && actions.deletable.tooltip
                        ? actions.deletable.tooltip
                        : "Delete"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {actions.custom?.map((action, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant || "ghost"}
                        size="sm"
                        onClick={() => action.onClick(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        {action.icon || <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    {action.tooltip && <TooltipContent>{action.tooltip}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }
    
    return cols;
  }, [columns, selectable, actions, onView, onEdit]);

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

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete?.(rowToDelete);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasSelection) return;
    
    setIsDeleting(true);
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      for (const row of selectedRows) {
        await onDelete?.(row);
      }
      table.resetRowSelection();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`w-full space-y-4 ${className || ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1">
          {searchConfig?.globalSearch ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchConfig.placeholder || "Search all columns..."}
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10 pr-10"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : searchConfig?.searchableColumn ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchConfig.placeholder || "Search..."}
                value={
                  (table
                    .getColumn(searchConfig.searchableColumn as string)
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn(searchConfig.searchableColumn as string)
                    ?.setFilterValue(event.target.value)
                }
                className="pl-10 pr-10"
              />
              {table.getColumn(searchConfig.searchableColumn as string)?.getFilterValue() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    table.getColumn(searchConfig.searchableColumn as string)?.setFilterValue("")
                  }
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : null}

          {/* Selection Actions */}
          {selectable && hasSelection && actions?.deletable && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedRowsCount} {selectedRowsCount === 1 ? "item" : "items"}
            </Button>
          )}
        </div>

        {/* Column Visibility */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
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
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
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
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {selectable && (
            <div>
              {selectedRowsCount} of {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          )}
          {pagination?.totalItems && (
            <div>
              Total: {pagination.totalItems} item(s)
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={`${paginationState.pageSize}`}
              onValueChange={(value) => {
                handlePaginationChange({
                  pageIndex: 0,
                  pageSize: Number(value),
                });
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={paginationState.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {(pagination?.pageSizeOptions || [5, 10, 20, 30, 50, 100]).map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {paginationState.pageIndex + 1} of{" "}
              {pagination?.totalPages || table.getPageCount()}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaginationChange({ ...paginationState, pageIndex: 0 })}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePaginationChange({
                  ...paginationState,
                  pageIndex: (pagination?.totalPages || table.getPageCount()) - 1,
                })
              }
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
