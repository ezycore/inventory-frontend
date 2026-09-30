"use client";
// coding-standard: maintained

import { useCrudModal } from "@/hooks/use-crud-handlers";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { stripHiddenValues } from "../form/type";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { CardCustomAction, DataCardProps } from "@/types/DataCard";
import { Card, CardContent } from "@/ui/components/card";
import { ErrorBoundaryFallback } from "@/ui/components/error-boundary-fallback";
import DynamicForm from "@/ui/components/form";
import { ExportDialog } from "@/components/shared/export/export-dialog";
import { ImportDialog } from "@/components/shared/import/import-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { BaseDataCard } from "./base-data-card";

export function DataCard<TData extends { _id: string }, TValue = any>(
  props: DataCardProps<TData, TValue>,
) {
  const t = useTranslations("common");
  const { cardTitle, defaultPageSize, pageSizes, filterConfig, toolbarAction, data: externalData, customActions,
    exportConfig,
    importConfig,
    module, loading = false,
    // Sorting config
    sortingConfig,
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
    // Loading card
    loadingRenderCard,
    // Fields
    fields,
    imageConfig,
    // Empty state
    emptyState,
    emptyMessage,
    emptyIcon,
    operations,
    syncUrl = true,
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
    onFieldChange,
  } = operations || {};

  const queryClient = useQueryClient();

  // Page, page size, sort and filters live in the URL, under the same keys as
  // `DataTable` (`hooks/use-list-url-state.ts`).
  const pageSizeOptions = pageSizes || [12, 24, 48, 96];
  const list = useListUrlState({
    defaults: {
      limit: defaultPageSize || 12,
      sortBy: sortingConfig?.defaultSortBy,
      sortOrder: sortingConfig?.defaultSortOrder || "desc",
    },
    filterFields: filterConfig?.fields,
    limitOptions: pageSizeOptions,
    sync: syncUrl,
  });
  const { page, limit, filters, sortBy, sortOrder, setSort } = list;
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Server-side sorting — a new sort starts again from page 1
  const isServerSorting = !!sortingConfig && !!getAllData;
  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => setSort(newSortBy, newSortOrder),
    [setSort],
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
      ? [...(queryKey || []), { page, limit, ...(filters || {}), ...(isServerSorting ? { sort_by: sortBy, sort_order: sortOrder } : {}) }]
      : [],
    queryFn: getAllData
      ? () => getAllData({ page, limit, ...filters, ...(isServerSorting ? { sort_by: sortBy, sort_order: sortOrder } : {}) })
      : () => Promise.resolve(undefined),
    enabled: !!getAllData && !externalData, // Only fetch if getAllData is provided and externalData is not
    placeholderData: (previousData) => previousData,
  });

  // Initial load (no cached data yet) — replaces cards with skeletons
  const isInitialLoading = (isLoading || loading) && !error;
  // Subsequent fetches while data already exists (sort / filter / page) — shows overlay spinner
  const isRefetching = isFetching && !isLoading && !loading && !error;

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
        pageSizeOptions,
        onPaginationChange: ({
          pageIndex,
          pageSize,
        }: {
          pageIndex: number;
          pageSize: number;
        }) => {
          if (limit !== pageSize) list.setLimit(pageSize);
          else list.setPage(pageIndex + 1);
        },
      };
    }

    // Client-side pagination (using external data)
    if (externalData && externalData.length > 0) {
      const pageOptions = pageSizes || [6, 12, 24, 48, 96];
      return {
        pageIndex: 0,
        pageSize: pageOptions[0],
        totalPages: 0, // Will be calculated by BaseDataCard
        totalItems: externalData.length,
        hasNext: false,
        hasPrev: false,
        manualPagination: false, // Client-side pagination
        pageSizeOptions: pageOptions,
        onPaginationChange: () => { }, // Handled internally by BaseDataCard
      };
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `list` setters are stable
  }, [page, limit, queryData, pageSizes, pageSizeOptions, externalData]);

  // Filter configuration with callbacks
  const mergedFilterConfig = useMemo(() => {
    if (!filterConfig) return undefined;
    return {
      ...(filterConfig || {}),
      initialValues: filters,
      onApply: (newFilters: Record<string, any>) => list.setFilters(newFilters), // back to page 1
      onReset: () => list.setFilters({}),
    };
    // `filters` is read when the bar mounts; `revision` remounts it after an
    // outside URL change, so it is the only other input that matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [filterConfig, list.revision]);

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
    entityName: entityName || "Item",
  });

  // Import / Export header buttons — same contract as DataTable, so a page that
  // toggles between the two views keeps the buttons in both. Declared before the
  // early `error` return so the hook order stays stable (rules-of-hooks).
  const mergedCustomActions = useMemo<CardCustomAction[]>(() => {
    const actions: CardCustomAction[] = [...(customActions || [])];

    if (importConfig) {
      actions.push({
        type: "import",
        placement: "header",
        label: importConfig.label || t("table.import"),
        icon: <Upload className="h-4 w-4" />,
        variant: "outline",
        onClick: () => setImportOpen(true),
      });
    }

    // Export only makes sense with rows loaded — hide on an empty list.
    if (exportConfig && data.length > 0) {
      actions.push({
        type: "export",
        placement: "header",
        label: exportConfig.label || t("table.exportCsv"),
        icon: <Download className="h-4 w-4" />,
        variant: "outline",
        onClick: () => setExportOpen(true),
      });
    }

    return actions;
  }, [customActions, exportConfig, importConfig, data, t]);

  // Export query params (current filters + server sort) + the server-side match
  // count, threaded into the ExportDialog.
  const exportParams = useMemo(
    () => ({
      ...filters,
      ...(isServerSorting ? { sort_by: sortBy, sort_order: sortOrder } : {}),
    }),
    [filters, isServerSorting, sortBy, sortOrder],
  );
  const exportTotal = queryData?.data?.total ?? data.length;

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

  // ring-0 is load-bearing: Card draws its outline with `ring-1`, not `border`,
  // and tailwind-merge won't let `border-none` cancel a ring.
  return (
    <Card className="border-none ring-0 shadow-none py-0 gap-3 bg-transparent">
      <CardContent className="p-0">
        <BaseDataCard
          // Remounted after an outside URL change, so the filter bar shows it.
          key={list.revision}
          {...restProps}
          title={cardTitle
            ? typeof cardTitle === "function"
              ? cardTitle(queryData?.data.total || 0)
              : cardTitle
            : undefined}
          data={data}
          isLoading={isInitialLoading}
          isFetching={isRefetching}
          pagination={paginationConfig}
          filterConfig={mergedFilterConfig}
          actions={mergedActions}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onBulkDelete={bulkDeleteMutation ? handleBulkDelete : undefined}
          toolbarAction={mergedToolbarAction}
          customActions={mergedCustomActions}
          module={module}
          // Sorting
          sortBy={isServerSorting ? sortBy : undefined}
          sortOrder={isServerSorting ? sortOrder : undefined}
          onSortChange={isServerSorting ? handleSortChange : undefined}
          sortingConfig={isServerSorting ? sortingConfig : undefined}
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
          // Loading card
          loadingRenderCard={loadingRenderCard}
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
            // Same bridge as DataTable: the form is created in here, so
            // appending it is the only way a caller's cross-field rule gets a
            // `setValue`. Missing entirely until 2026-08-07, which silently
            // disabled every `operations.onFieldChange` on a card-view page —
            // the products VAT prefill among them, since cards are that page's
            // default view.
            onFieldChange={
              onFieldChange &&
              ((fieldName: string, value: any, all: any) =>
                onFieldChange(
                  fieldName,
                  value,
                  stripHiddenValues(formConfig, all),
                  form,
                ))
            }
          />
        )}

        {importConfig && (
          <ImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            title={`Import ${entityName || ""}`.trim()}
            downloadTemplate={importConfig.downloadTemplate}
            preview={importConfig.preview}
            commit={importConfig.commit}
            // A bulk import stales the whole module family (stats cards,
            // select-options, …), not just the visible list page — invalidate
            // by the module root key so every active query refetches.
            onCommitted={() =>
              queryKey
                ? queryClient.invalidateQueries({ queryKey })
                : refetch()
            }
          />
        )}

        {exportConfig && (
          <ExportDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
            total={exportTotal}
            note={exportConfig.note}
            options={exportConfig.options}
            onExport={(params) =>
              exportConfig.download({ ...exportParams, ...params })
            }
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
