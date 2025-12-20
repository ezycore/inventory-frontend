import { useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface UseCrudModalOptions<T> {
 form: UseFormReturn<T>;
 defaultValues?: T;
 transformEditData?: (item: T) => T;
 onDeleteFn?: (id: string) => Promise<void>;
 entityName?: string;
}

export function useCrudModal<T extends { _id: string }>({
 form,
 defaultValues = {} as T,
 transformEditData,
 onDeleteFn,
 entityName = "Item",
}: UseCrudModalOptions<T>) {
 // ===== STATE =====
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState<T | null>(null);
 const [isViewMode, setIsViewMode] = useState(false);

 // ===== HANDLERS =====
 const handleAdd = useCallback(() => {
  setEditingItem(null);
  setIsViewMode(false);
  form.reset(defaultValues);
  setIsModalOpen(true);
 }, [form, defaultValues]);

 const handleEdit = useCallback((item: T) => {
  setEditingItem(item);
  setIsViewMode(false);
  const formData = transformEditData ? transformEditData(item) : item;
  form.reset(formData);
  setIsModalOpen(true);
 }, [form, transformEditData]);

 const handleView = useCallback((item: T) => {
  setEditingItem(item);
  setIsViewMode(true);
  const formData = transformEditData ? transformEditData(item) : item;
  form.reset(formData);
  setIsModalOpen(true);
 }, [form, transformEditData]);

 const handleDelete = useCallback(async (item: T) => {
  if (!onDeleteFn) {
   console.warn("onDeleteFn not provided to useCrudModal");
   return;
  }

  try {
   await onDeleteFn(item._id);
  } catch (error) {
   console.error(`Delete ${entityName.toLowerCase()} error:`, error);
  }
 }, [onDeleteFn, entityName]);

 const handleCloseModal = useCallback(() => {
  setIsModalOpen(false);
  setEditingItem(null);
  setIsViewMode(false);
 }, []);

 // ===== RETURN =====
 return {
  // State
  isModalOpen,
  editingItem,
  isViewMode,

  // Handlers
  handleAdd,
  handleEdit,
  handleView,
  handleDelete,
  handleCloseModal,

  // Setters (if needed for edge cases)
  setIsModalOpen,
  setEditingItem,
  setIsViewMode,
 };
}