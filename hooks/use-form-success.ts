import { useCallback } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

export interface FormSuccessOptions {
 queryKey: QueryKey;
 onClose: () => void;
 refetch?: () => void;
 editMode?: boolean;
 entityName?: string;
}

export function useFormSuccess({
 queryKey,
 onClose,
 refetch,
 editMode = false,
 entityName = "Item",
}: FormSuccessOptions) {
 const queryClient = useQueryClient();

 return useCallback(
  (result: any, data: any) => {
   const action = editMode ? "updated" : "created";
   toast.success(`${entityName} ${action} successfully`);
   onClose();
   queryClient.invalidateQueries({ queryKey });
   if (refetch) {
    refetch();
   }
  },
  [queryClient, queryKey, onClose, refetch, editMode, entityName]
 );
}

export interface FormFailedOptions {
 editMode?: boolean;
 entityName?: string;
}

export function useFormFailed({
 editMode = false,
 entityName = "Item",
}: FormFailedOptions = {}) {
 return useCallback(
  (error: any, data: any) => {
   const action = editMode ? "update" : "create";
   toast.error(`Failed to ${action} ${entityName.toLowerCase()}`);
   console.error(`Form submission error:`, error);
  },
  [editMode, entityName]
 );
}
