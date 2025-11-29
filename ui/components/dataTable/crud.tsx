/**
 * DataTable with Integrated CRUD Operations
 * 
 * This component wraps the base DataTable and adds automatic CRUD handling.
 * Use this when you need add/edit/view/delete with forms.
 * 
 * @example
 * ```tsx
 * <DataTableCrud
 *   columns={columns}
 *   data={brandsData}
 *   crud={{
 *     formConfig: brandFormConfig,
 *     createMutation: useCreateBrand(),
 *     updateMutation: useUpdateBrand(),
 *     deleteMutation: useDeleteBrand(),
 *     entityName: "Brand",
 *     queryKey: queryKeys.brands.all(),
 *     prepareSubmitData: (data, isEdit, item) => ({
 *       ...data,
 *       slug: generateSlug(data.name),
 *       ...(isEdit && item ? { id: item._id } : {})
 *     })
 *   }}
 *   // All other DataTable props...
 * />
 * ```
 */

"use client";

import { useState } from "react";
import { DataTable } from "./index";
import DynamicForm from "@/ui/components/form";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { usePageState } from "@/hooks/use-page-state";
import { useCrudHandlers } from "@/hooks/use-crud-handlers";
import { useFormSuccess, useFormFailed } from "@/hooks/use-form-success";
import { DataTableProps } from "@/types/DataTable";
import { Plus } from "lucide-react";

export function DataTableCrud<TData extends { _id: string }, TValue = any>(
  props: DataTableProps<TData, TValue>
) {
  const { crud, actions, onEdit, onView, onDelete, toolbarAction, ...restProps } = props;

  // Page state management - MUST call hooks unconditionally
  const pageState = usePageState<TData>();
  const { modal, editing, view } = pageState;

  // Form management
  const defaultValues = crud?.defaultValues || {};
  const { form } = useDynamicForm(crud?.formConfig || { fields: [] }, defaultValues);

  // CRUD handlers
  const { handleAdd, handleEdit, handleView, handleDelete } = useCrudHandlers<TData>({
    form,
    setEditingItem: editing.setItem,
    setIsViewMode: view.setIsViewMode,
    setIsModalOpen: modal.setIsOpen,
    defaultValues,
    onDeleteFn: crud?.deleteMutation
      ? async (id: string) => {
          await crud.deleteMutation.mutateAsync(id);
        }
      : undefined,
    entityName: crud?.entityName || "Item",
  });

  // Form submission handlers
  const onSuccess = useFormSuccess({
    queryKey: crud?.queryKey || [],
    onClose: () => modal.setIsOpen(false),
    editMode: !!editing.item,
    entityName: crud?.entityName || "Item",
  });

  const onFailed = useFormFailed({
    editMode: !!editing.item,
    entityName: crud?.entityName || "Item",
  });

  // If no CRUD config, fall back to regular DataTable
  if (!crud) {
    return <DataTable {...props} />;
  }

  // Prepare submit data
  const prepareSubmitData = (data: any) => {
    if (crud.prepareSubmitData) {
      return crud.prepareSubmitData(data, !!editing.item, editing.item);
    }
    
    // Default: add ID for edit mode
    if (editing.item) {
      return { id: editing.item._id, ...data };
    }
    return data;
  };

  // Determine mutation hook
  const mutationHook = editing.item ? crud.updateMutation : crud.createMutation;

  // Merge actions with CRUD config
  const mergedActions = {
    ...actions,
    ...(crud.disableEdit ? {} : { editable: actions?.editable ?? { tooltip: `Edit ${crud.entityName}` } }),
    ...(crud.disableView ? {} : { viewable: actions?.viewable ?? { tooltip: `View ${crud.entityName} details` } }),
    ...(crud.disableDelete ? {} : { deletable: actions?.deletable ?? { tooltip: `Delete ${crud.entityName}` } }),
  };

  // Merge toolbar action
  const mergedToolbarAction = toolbarAction || (crud.disableAdd ? undefined : {
    label: `Add ${crud.entityName}`,
    icon: <Plus className="h-4 w-4" />,
    onClick: handleAdd,
    variant: "default" as const,
  });

  return (
    <>
      <DataTable
        {...restProps}
        actions={mergedActions}
        onEdit={onEdit || (!crud.disableEdit ? handleEdit : undefined)}
        onView={onView || (!crud.disableView ? handleView : undefined)}
        onDelete={onDelete || (!crud.disableDelete ? handleDelete : undefined)}
        toolbarAction={mergedToolbarAction}
      />

      {/* Integrated CRUD Form Modal */}
      {mutationHook && (
        <DynamicForm
          form={form}
          config={crud.formConfig}
          mutationHook={mutationHook}
          onSubmit={prepareSubmitData}
          openInside="modal"
          open={modal.isOpen}
          onOpenChange={modal.setIsOpen}
          title={
            view.isViewMode
              ? `View ${crud.entityName}`
              : editing.item
              ? `Edit ${crud.entityName}`
              : `Add New ${crud.entityName}`
          }
          submitLabel={editing.item ? `Update ${crud.entityName}` : `Create ${crud.entityName}`}
          modalSize="md"
          viewMode={view.isViewMode}
          onSuccess={onSuccess}
          onFailed={onFailed}
        />
      )}
    </>
  );
}
