import { useState } from "react";
import { PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/types/DataTable";

/**
 * Internal DataTable hook - manages TanStack Table pagination state
 * Used by DataTable component to handle client-side pagination
 * 
 * @param pagination - Optional pagination config from parent
 * @returns Pagination state and handler for TanStack Table
 * 
 * Behavior:
 * - If pagination prop is passed: Uses provided values (0-based indexing)
 * - If pagination prop is NOT passed: Uses client-side pagination with defaults (pageIndex: 0, pageSize: 10)
 */
export function usePaginationState(pagination?: DataTablePagination) {
 const paginationState: PaginationState = {
  // Use 0-based indexing for TanStack Table (consistent with or without pagination prop)
  pageIndex: pagination?.pageIndex ?? 0,
  pageSize: pagination?.pageSize ?? 10,
 };

 // Handle pagination change
 const handlePaginationChange = (updater: any) => {
  const newState =
   typeof updater === "function" ? updater(paginationState) : updater;

  // Only call parent handler if pagination config was provided
  pagination?.onPaginationChange?.(newState);
 };

 return { paginationState, handlePaginationChange };
}

export function useDeleteDialog<TData>(onDelete?: (row: TData) => void | Promise<void>) {
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const [rowToDelete, setRowToDelete] = useState<TData | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);

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

 const openDeleteDialog = (row: TData) => {
  setRowToDelete(row);
  setDeleteDialogOpen(true);
 };

 return {
  deleteDialogOpen,
  setDeleteDialogOpen,
  rowToDelete,
  isDeleting,
  handleDeleteConfirm,
  openDeleteDialog,
 };
}
