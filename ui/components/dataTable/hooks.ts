import { useState } from "react";
import { PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@/types/DataTable";

export function usePaginationState(pagination?: DataTablePagination) {
 const paginationState: PaginationState = {
  pageIndex: pagination?.pageIndex ?? 0,
  pageSize: pagination?.pageSize ?? 10,
 };

 // Handle pagination change
 const handlePaginationChange = (updater: any) => {
  const newState =
   typeof updater === "function" ? updater(paginationState) : updater;
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
