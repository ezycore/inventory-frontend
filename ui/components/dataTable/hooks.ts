import { useState, useCallback } from "react";
import { PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/types/DataTable";

export function usePaginationState(pagination?: DataTablePagination) {
 // Use state to track pagination internally
 const [internalPagination, setInternalPagination] = useState<PaginationState>({
  pageIndex: pagination?.pageIndex ?? 0,
  pageSize: pagination?.pageSize ?? 10,
 });

 // Use provided pagination state if available, otherwise use internal
 const paginationState: PaginationState = {
  pageIndex: pagination?.pageIndex ?? internalPagination.pageIndex,
  pageSize: pagination?.pageSize ?? internalPagination.pageSize,
 };

 // Handle pagination change - use functional setState to avoid stale closure
 const handlePaginationChange = useCallback((updater: any) => {
  setInternalPagination((prevState) => {
   // Calculate new state from previous state to avoid closure issues
   const currentState = {
    pageIndex: pagination?.pageIndex ?? prevState.pageIndex,
    pageSize: pagination?.pageSize ?? prevState.pageSize,
   };

   const newState =
    typeof updater === "function" ? updater(currentState) : updater;

   // Notify parent component asynchronously
   setTimeout(() => {
    pagination?.onPaginationChange?.(newState);
   }, 0);

   return newState;
  });
 }, [pagination?.pageIndex, pagination?.pageSize, pagination?.onPaginationChange]);

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
