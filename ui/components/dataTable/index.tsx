"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BaseDataTable } from "./base-data-table ";
import DynamicForm from "@/ui/components/form";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { usePageState } from "@/hooks/use-page-state";
import { useCrudHandlers } from "@/hooks/use-crud-handlers";
import { useFormSuccess, useFormFailed } from "@/hooks/use-form-success";
import { DataTableProps } from "@/types/DataTable";
import { Plus } from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ErrorBoundaryFallback } from "../error-boundary-fallback";

export function DataTable<TData extends { _id: string }, TValue = any>(
  props: DataTableProps<TData, TValue>
) {
  const { operations, actions, onEdit, onView, onDelete, defaultPageSize, pageSizes, toolbarAction, data: externalData, pagination: externalPagination, isLoading: externalIsLoading, filterConfig, cardTitle, ...restProps } = props;

  const {getAllData, queryKey, defaultValues, transformEditData, deleteMutation, entityName, formConfig, disableAdd, disableEdit, disableView, disableDelete, updateMutation, createMutation, prepareSubmitData} = operations || {};
  
  // Internal state for self-contained mode
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize || 10);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Data fetching (self-contained mode)
  const { data: queryData, isLoading: queryIsLoading, error, refetch } = useQuery<ApiResponse<PaginatedResponse<TData>>>({
    queryKey: getAllData ? [...queryKey, page, limit, filters] : [],
    queryFn: getAllData ? () => getAllData({ page, limit, ...filters }) : () => Promise.resolve(undefined),
    enabled: !!getAllData,
    placeholderData: (previousData) => previousData,
  });

  // Determine data source and loading state
  const data = useMemo(() => {
    if (getAllData) {
      return queryData?.data?.items || [];
    }
    return externalData || [];
  }, [getAllData, queryData, externalData]);

  const isLoading = getAllData ? queryIsLoading : (externalIsLoading || false);

  // Pagination configuration
  const paginationConfig = useMemo(() => {
    if (getAllData) {
      return {
        pageIndex: page - 1,
        pageSize: limit,
        totalPages: queryData?.data?.totalPages,
        totalItems: queryData?.data?.total,
        hasNext: queryData?.data?.hasNext,
        hasPrev: queryData?.data?.hasPrev,
        manualPagination: true,
        pageSizeOptions: pageSizes || [10, 20, 50, 100],
        onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
          setPage(pageIndex + 1);
          setLimit(pageSize);
        },
      };
    }
    return externalPagination;
  }, [getAllData, page, limit, queryData, externalPagination, pageSizes]);

  // Filter configuration with callbacks
  const mergedFilterConfig = useMemo(() => {
    if (!filterConfig) return undefined;

    if (getAllData) {
      return {
        ...filterConfig,
        onApply: (newFilters: Record<string, any>) => {
          setFilters(newFilters);
          setPage(1); // Reset to first page when filters change
          filterConfig.onApply?.(newFilters);
        },
        onReset: () => {
          setFilters({});
          setPage(1); // Reset to first page when filters are cleared
          filterConfig.onReset?.();
        },
      };
    }
    return filterConfig;
  }, [filterConfig, getAllData]);

  // Page state management - MUST call hooks unconditionally
  const pageState = usePageState<TData>();
  const { modal, editing, view } = pageState;

  // Form management
  const { form } = useDynamicForm(formConfig || { fields: [] }, defaultValues);

  // CRUD handlers
  const { handleAdd, handleEdit, handleView, handleDelete } = useCrudHandlers<TData>({
    form,
    setEditingItem: editing.setItem,
    setIsViewMode: view.setIsViewMode,
    setIsModalOpen: modal.setIsOpen,
    defaultValues,
    transformEditData: transformEditData,
    onDeleteFn: deleteMutation
      ? async (id: string) => {
        await deleteMutation.mutateAsync(id);
      }
      : undefined,
    entityName: entityName || "Item",
  });

  // Form submission handlers
  const onSuccess = useFormSuccess({
    queryKey: queryKey || [],
    onClose: () => modal.setIsOpen(false),
    editMode: !!editing.item,
    entityName: entityName || "Item",
  });

  const onFailed = useFormFailed({
    editMode: !!editing.item,
    entityName: entityName || "Item",
  });

  if(error){
    return <ErrorBoundaryFallback error={error} onRetry={refetch}/>
  }

  if((!data || data.length === 0) && !isLoading){
    return <div className="p-6 text-center text-gray-500">No data available.</div>
  }

  // If no CRUD config, fall back to regular DataTable
  if (!operations) {
    return <BaseDataTable {...props} />;
  }

  // Prepare submit data
  const readyDataForSubmit = (data: any) => {
    if (prepareSubmitData) {
      return prepareSubmitData(data, !!editing.item, editing.item);
    }

    // Default: add ID for edit mode
    if (editing.item) {
      return { id: editing.item._id, ...data };
    }
    return data;
  };

  // Determine mutation hook
  const mutationHook = editing.item ? updateMutation : createMutation;

  // Merge actions with CRUD config
  const mergedActions = {
    ...actions,
    ...(disableEdit ? {} : { editable: actions?.editable ?? { tooltip: `Edit ${entityName}` } }),
    ...(disableView ? {} : { viewable: actions?.viewable ?? { tooltip: `View ${entityName} details` } }),
    ...(disableDelete ? {} : { deletable: actions?.deletable ?? { tooltip: `Delete ${entityName}` } }),
  };

  // Merge toolbar action
  const mergedToolbarAction = toolbarAction || (disableAdd ? undefined : {
    label: `Add ${entityName}`,
    icon: <Plus className="h-4 w-4" />,
    onClick: handleAdd,
    variant: "default" as const,
  });

  return (
      <Card>
        {
          cardTitle && (
            <CardHeader>
              <CardTitle>{typeof cardTitle === "function" ? cardTitle(data?.length || 0) : cardTitle}</CardTitle>
            </CardHeader>
          )
        }
        <CardContent>
          <BaseDataTable
            {...restProps}
            data={data}
            isLoading={isLoading}
            pagination={paginationConfig}
            filterConfig={mergedFilterConfig}
            actions={mergedActions}
            onEdit={onEdit || (!disableEdit ? handleEdit : undefined)}
            onView={onView || (!disableView ? handleView : undefined)}
            onDelete={onDelete || (!disableDelete ? handleDelete : undefined)}
            toolbarAction={mergedToolbarAction}
          />

          {/* Integrated CRUD Form Modal */}
          {mutationHook && (
            <DynamicForm
              form={form}
              config={formConfig}
              mutationHook={mutationHook}
              onSubmit={readyDataForSubmit}
              openInside="modal"
              open={modal.isOpen}
              onOpenChange={modal.setIsOpen}
              title={
                view.isViewMode
                  ? `View ${entityName}`
                  : editing.item
                    ? `Edit ${entityName}`
                    : `Add New ${entityName}`
              }
              submitLabel={editing.item ? `Update ${entityName}` : `Create ${entityName}`}
              modalSize="md"
              viewMode={view.isViewMode}
              onSuccess={onSuccess}
              onFailed={onFailed}
            />
          )}
        </CardContent>
      </Card>
  );
}
