"use client";

import { useCrudModal } from "@/hooks/use-crud-handlers";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { DataCardProps } from "@/types/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ErrorBoundaryFallback } from "@/ui/components/error-boundary-fallback";
import DynamicForm from "@/ui/components/form";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BaseDataCard } from "./base-data-card";

export function DataCard<TData extends { _id: string }, TValue = any>(
  props: DataCardProps<TData, TValue>,
) {
  const {
    cardTitle,
    defaultPageSize,
    pageSizes,
    filterConfig,
    toolbarAction,
    data: externalData,
    customActions,
    module,
    loading = false,
    // Card layout props
    layoutConfig,
    cardSize,
    // Card styling props
    variant,
    cardClassName,
    enableCardHover,
    rounded,
    shadow,
    // Custom rendering
    renderCard,
    // Fields
    fields,
    imageConfig,
    // Empty state
    emptyState,
    emptyMessage,
    emptyIcon,
    operations,
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
  const [limit, setLimit] = useState(defaultPageSize || 12);
  const [filters, setFilters] = useState<Record<string, any>>(urlFilters);

  // Data fetching (self-contained mode)
  const {
    data: queryData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ApiResponse<PaginatedResponse<TData>>>({
    queryKey: getAllData
      ? [...(queryKey || []), { page, limit, ...(filters || {}) }]
      : [],
    queryFn: getAllData
      ? () => getAllData({ page, limit, ...filters })
      : () => Promise.resolve(undefined),
    enabled: !!getAllData && !externalData, // Only fetch if getAllData is provided and externalData is not
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
    // Server-side pagination (using getAllData)
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
        pageSizeOptions: pageSizes || [12, 24, 48, 96],
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

    // Client-side pagination (using external data)
    if (externalData && externalData.length > 0) {
      const pageOptions = pageSizes || [12, 24, 48, 96];
      return {
        pageIndex: 0,
        pageSize: pageOptions[0],
        totalPages: 0, // Will be calculated by BaseDataCard
        totalItems: externalData.length,
        hasNext: false,
        hasPrev: false,
        manualPagination: false, // Client-side pagination
        pageSizeOptions: pageOptions,
        onPaginationChange: () => {}, // Handled internally by BaseDataCard
      };
    }

    return undefined;
  }, [page, limit, queryData, pageSizes, externalData]);

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

  const { form } = useDynamicForm(formConfig || { fields: [] }, defaultValues);

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
    defaultValues,
    transformEditData,
    onDeleteFn: deleteMutation?.mutateAsync,
    onBulkDeleteFn: bulkDeleteMutation?.mutateAsync,
    entityName: entityName || "Item",
  });

  if (error) {
    return <ErrorBoundaryFallback error={error} onRetry={refetch} />;
  }

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
              ? cardTitle(data?.length || 0)
              : cardTitle}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <BaseDataCard
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
          module={module}
          // Layout
          layoutConfig={layoutConfig}
          cardSize={cardSize}
          // Styling
          variant={variant}
          cardClassName={cardClassName}
          enableCardHover={enableCardHover}
          rounded={rounded}
          shadow={shadow}
          // Custom rendering
          renderCard={renderCard}
          // Fields
          fields={fields}
          imageConfig={imageConfig}
          // Empty state
          emptyState={emptyState}
          emptyMessage={emptyMessage}
          emptyIcon={emptyIcon}
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
          />
        )}
      </CardContent>
    </Card>
  );
}

// Re-export for convenience
export type * from "@/types/DataCard";
export { BaseDataCard } from "./base-data-card";
export { CardEmptyState, CardItem, CardSkeleton } from "./card-variants";
