"use client";

import { useCrudModal } from "@/hooks/use-crud-handlers";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { DataTableProps } from "@/types/DataTable";
import DynamicForm from "@/ui/components/form";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ErrorBoundaryFallback } from "../error-boundary-fallback";
import { BaseDataTable } from "./base-data-table ";

export function DataTable<TData extends { _id: string }, TValue = any>(
  props: DataTableProps<TData, TValue>,
) {
  const {
    cardTitle,
    defaultPageSize,
    pageSizes,
    filterConfig,
    operations,
    toolbarAction,
    data: externalData,
    customActions,
    manageColumns,
    module,
    loading = false,
    sortingConfig,
    // Table styling props
    variant,
    headless,
    borderless,
    rowSpacing,
    zebra,
    roundedRows,
    stickyHeader,
    rowBgColor,
    ...restProps
  } = props;

  const {
    formConfig,
    defaultValues,
    openInside,
    getAllData,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    queryKey,
    entityName,
    isViewAvailable,
    editTooltip,
    deleteTooltip,
    viewTooltip,
    transformEditData,
    prepareSubmitData,
    disabledFieldsInEdit,
  } = operations || {};

  // Read initial filter values from URL query params
  const urlFilters = useUrlFilters(filterConfig);

  // Internal state for self-contained mode
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize || 10);
  const [filters, setFilters] = useState<Record<string, any>>(urlFilters);

  // Server-side sorting state — only active when sortOptions has entries
  const sortableFields = useMemo(
    () => sortingConfig?.sortOptions?.map((o) => o.field) ?? [],
    [sortingConfig],
  );
  const isServerSorting = sortableFields.length > 0 && !!getAllData;
  const [sorting, setSorting] = useState<SortingState>(
    sortingConfig?.defaultSortBy
      ? [{ id: sortingConfig.defaultSortBy, desc: sortingConfig.defaultSortOrder === "desc" }]
      : [],
  );

  // Derive sort_by / sort_order from TanStack SortingState
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  // Server sorting change handler — also resets to page 1
  const handleSortingChange = useCallback(
    (newSorting: SortingState) => {
      setSorting(newSorting);
      if (isServerSorting) setPage(1);
    },
    [isServerSorting],
  );

  // Data fetching (self-contained mode)
  const {
    data: queryData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ApiResponse<PaginatedResponse<TData>>>({
    queryKey: getAllData
      ? [...queryKey, { page, limit, ...(filters || {}), ...(isServerSorting ? { sort_by: sortBy, sort_order: sortOrder } : {}) }]
      : [],
    queryFn: getAllData
      ? () => getAllData({ page, limit, ...filters, ...(isServerSorting ? { sort_by: sortBy, sort_order: sortOrder } : {}) })
      : () => Promise.resolve(undefined),
    enabled: !!getAllData,
    placeholderData: (previousData) => previousData,
  });

  // Combine loading states: isLoading (first load), isFetching (subsequent fetches), and external loading prop
  const isLoadingData = isLoading || isFetching || loading;

  // Determine data source and loading state
  const data = useMemo(() => {
    if (queryData && queryData.data) {
      return queryData?.data?.items || [];
    }
    return externalData || [];
  }, [queryData, externalData]);

  // Pagination configuration
  const paginationConfig = useMemo(() => {
    if (queryData && queryData.data) {
      const { totalPages, total, hasNext, hasPrev } = queryData.data;
      return {
        pageIndex: page - 1,
        pageSize: limit,
        totalPages: totalPages,
        totalItems: total,
        hasNext: hasNext,
        hasPrev: hasPrev,
        manualPagination: true,
        pageSizeOptions: pageSizes || [10, 20, 50, 100],
        onPaginationChange: ({
          pageIndex,
          pageSize,
        }: {
          pageIndex: number;
          pageSize: number;
        }) => {
          setPage(pageIndex + 1);
          limit !== pageSize && setLimit(pageSize);
        },
      };
    }
  }, [page, limit, queryData, pageSizes]);

  // Filter configuration with callbacks
  const mergedFilterConfig = useMemo(() => {
    if (!filterConfig) return undefined;
    return {
      ...(filterConfig || {}),
      initialValues: urlFilters,
      onApply: (newFilters: Record<string, any>) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
      },
      onReset: () => {
        setFilters({});
        setPage(1); // Reset to first page when filters are cleared
      },
    };
  }, [filterConfig, urlFilters]);

  const { form, defaultValues: mergedDefaults } = useDynamicForm(formConfig || { fields: [] }, defaultValues);

  const {
    isModalOpen,
    editingItem,
    isViewMode,
    handleAdd,
    handleEdit,
    handleView,
    handleDelete,
    handleBulkDelete,
    handleCloseModal,
  } = useCrudModal<TData>({
    form,
    defaultValues: mergedDefaults as TData,
    transformEditData,
    onDeleteFn: deleteMutation?.mutateAsync,
    onBulkDeleteFn: bulkDeleteMutation?.mutateAsync,
    entityName: "Brand",
  });

  if (error) {
    return <ErrorBoundaryFallback error={error} onRetry={refetch} />;
  }

  // if((!data || data.length === 0) && !isLoading){
  //   return <div className="p-6 text-center text-gray-500">No data available.</div>
  // }

  // Prepare submit data
  const readyDataForSubmit = (data: any) => {
    if (prepareSubmitData) {
      const preparedData = prepareSubmitData(data, !!editingItem, editingItem);

      // Auto-inject ID for edit mode if not already present
      if (editingItem) {
        if (preparedData instanceof FormData) {
          // Only add ID if it's not already in FormData
          if (!preparedData.has("id")) {
            preparedData.append("id", editingItem._id);
          }
        } else if (typeof preparedData === "object" && !preparedData.id) {
          // Add ID to object if not present
          return { id: editingItem._id, ...preparedData };
        }
      }

      return preparedData;
    }

    // Default: add ID for edit mode
    if (editingItem) {
      return { id: editingItem._id, ...data };
    }
    return data;
  };

  // Determine mutation hook
  const mutationHook = editingItem ? updateMutation : createMutation;

  // Merge actions with CRUD config
  const mergedActions = {
    ...(!deleteMutation
      ? {}
      : {
          deletable: deleteTooltip
            ? { tooltip: deleteTooltip }
            : { tooltip: `Delete ${entityName}` },
        }),
    ...(!isViewAvailable
      ? {}
      : {
          viewable: viewTooltip
            ? { tooltip: viewTooltip }
            : { tooltip: `View ${entityName}` },
        }),
    ...(!updateMutation
      ? {}
      : {
          editable: editTooltip
            ? { tooltip: editTooltip }
            : { tooltip: `Edit ${entityName}` },
        }),
  };

  // Merge toolbar action
  const mergedToolbarAction =
    toolbarAction ||
    (!createMutation
      ? undefined
      : {
          label: `Add ${entityName}`,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleAdd,
          variant: "default" as const,
        });

        return (
    <Card className="border-none shadow-none py-0 gap-3 bg-transparent">
      {cardTitle && (
        <CardHeader className="px-0">
          <CardTitle>
            {typeof cardTitle === "function"
              ? cardTitle(queryData?.data.total || 0)
              : cardTitle}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <BaseDataTable
          {...restProps}
          data={data}
          isLoading={isLoadingData}
          pagination={paginationConfig}
          filterConfig={mergedFilterConfig}
          actions={mergedActions}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onBulkDelete={bulkDeleteMutation ? handleBulkDelete : undefined}
          toolbarAction={mergedToolbarAction}
          customActions={customActions}
          manageColumns={manageColumns}
          manualSorting={isServerSorting}
          sortingState={isServerSorting ? sorting : undefined}
          onSortingChange={isServerSorting ? handleSortingChange : undefined}
          serverSortableFields={isServerSorting ? sortableFields : undefined}
          variant={variant}
          headless={headless}
          borderless={borderless}
          rowSpacing={rowSpacing}
          zebra={zebra}
          roundedRows={roundedRows}
          stickyHeader={stickyHeader}
          rowBgColor={rowBgColor}
          module={module}
          fullColumns={props.columns}
        />

        {/* Integrated CRUD Form Modal */}
        {mutationHook && (
          <DynamicForm
            form={form}
            config={formConfig}
            mutationHook={mutationHook}
            onSubmit={readyDataForSubmit}
            openInside={openInside || "modal"}
            actionsPlacement={openInside === "drawer" ? "top" : "bottom"}
            open={isModalOpen}
            resetAfterSubmit={!editingItem}
            onOpenChange={handleCloseModal}
            title={
              isViewMode
                ? `${entityName} Details`
                : editingItem
                  ? `Edit ${entityName}`
                  : `Add New ${entityName}`
            }
            submitLabel={
              editingItem ? `Update ${entityName}` : `Create ${entityName}`
            }
            modalSize="md"
            viewMode={isViewMode}
            onSuccess={handleCloseModal}
            disabledFieldsInEdit={disabledFieldsInEdit}
            isEditMode={!!editingItem}
            onFieldChange={(fieldName, value, all) => {
             console.log("Field changed:", fieldName, value, all);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
