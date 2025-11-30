import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

export interface CrudHandlersOptions<T> {
 form: UseFormReturn<any>;
 setEditingItem: (item: T | null) => void;
 setIsViewMode: (isView: boolean) => void;
 setIsModalOpen: (isOpen: boolean) => void;
 defaultValues?: any;
 transformEditData?: (item: T) => any;
 onDeleteFn?: (id: string) => Promise<void>;
 entityName?: string;
}

export function useCrudHandlers<T extends { _id: string }>({
 form,
 setEditingItem,
 setIsViewMode,
 setIsModalOpen,
 defaultValues = {},
 transformEditData,
 onDeleteFn,
 entityName = "Item",
}: CrudHandlersOptions<T>) {

 const handleAdd = useCallback(() => {
  setEditingItem(null);
  setIsViewMode(false);
  form.reset(defaultValues);
  setIsModalOpen(true);
 }, [form, setEditingItem, setIsViewMode, setIsModalOpen, defaultValues]);

 const handleEdit = useCallback((item: T) => {
  setEditingItem(item);
  setIsViewMode(false);
  // Transform data if transformer is provided, otherwise use item directly
  const formData = transformEditData ? transformEditData(item) : item;
  form.reset(formData);
  setIsModalOpen(true);
 }, [form, setEditingItem, setIsViewMode, setIsModalOpen, transformEditData]);

 const handleView = useCallback((item: T) => {
  setEditingItem(item);
  setIsViewMode(true);
  // Transform data if transformer is provided, otherwise use item directly
  const formData = transformEditData ? transformEditData(item) : item;
  form.reset(formData);
  setIsModalOpen(true);
 }, [form, setEditingItem, setIsViewMode, setIsModalOpen, transformEditData]);

 const handleDelete = useCallback(async (item: T) => {
  if (!onDeleteFn) {
   console.warn("onDeleteFn not provided to useCrudHandlers");
   return;
  }

  try {
   await onDeleteFn(item._id);
   toast.success(`${entityName} deleted successfully`);
  } catch (error) {
   toast.error(`Failed to delete ${entityName.toLowerCase()}`);
   console.error(`Delete ${entityName.toLowerCase()} error:`, error);
  }
 }, [onDeleteFn, entityName]);

 return { handleAdd, handleEdit, handleView, handleDelete };
}
