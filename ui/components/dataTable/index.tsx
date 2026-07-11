"use client";
// coding-standard: maintained

import { ExportDialog } from "@/components/shared/export/export-dialog";
import { useCrudModal } from "@/hooks/use-crud-handlers";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { CustomAction, DataTableProps } from "@/types/DataTable";
import DynamicForm from "@/ui/components/form";
import { ImportDialog } from "@/components/shared/import/import-dialog";
import { printTable } from "@/utils/print";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Download, Plus, Printer, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "../card";
import { ErrorBoundaryFallback } from "../error-boundary-fallback";
import { BaseDataTable } from "./base-data-table ";
import { stripHiddenValues } from "../form/type";

export function DataTable<TData extends { _id: string }, TValue = any>(
  props: DataTableProps<TData, TValue>,
) {
  const t = useTranslations("common");
  const {
    cardTitle,
    defaultPageSize,
    pageSizes,
    filterConfig,
    operations,
    toolbarAction,
    data: externalData,
    customActions,
    exportConfig,
    importConfig,
    printConfig,
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
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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

  // Initial load (no cached data yet) — replaces table rows with skeleton
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
    entityName,
  });

  // Export / Print header buttons — expressed as customActions so no new props
  // need threading through BaseDataTable and the toolbar. Declared before the
  // early `error` return so the hook order stays stable (rules-of-hooks).
  const mergedCustomActions = useMemo<CustomAction[]>(() => {
    const actions: CustomAction[] = [...(customActions || [])];

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

    // Export + Print only make sense with rows loaded — hide on an empty list.
    // The export click just opens the ExportDialog (confirm + column preset).
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

    if (printConfig && data.length > 0) {
      actions.push({
        type: "print",
        placement: "header",
        label: printConfig.label || t("table.print"),
        icon: <Printer className="h-4 w-4" />,
        variant: "outline",
        onClick: () => {
          // Called synchronously from the click so the popup isn't blocked.
          const opened = printTable(data, printConfig.columns, {
            title: printConfig.title,
          });
          if (!opened) toast.error(t("table.popupBlocked"));
        },
      });
    }

    return actions;
  }, [customActions, exportConfig, importConfig, printConfig, data, t, setImportOpen, setExportOpen]);

  // Export query params (current filters + server sort) + the server-side match
  // count, threaded into the ExportDialog. Kept before the early return so the
  // hook order stays stable (rules-of-hooks).
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
            : { tooltip: t("table.deleteEntity", { entity: entityName }) },
        }),
    ...(!isViewAvailable
      ? {}
      : {
          viewable: viewTooltip
            ? { tooltip: viewTooltip }
            : { tooltip: t("table.viewEntity", { entity: entityName }) },
        }),
    ...(!updateMutation
      ? {}
      : {
          editable: editTooltip
            ? { tooltip: editTooltip }
            : { tooltip: t("table.editEntity", { entity: entityName }) },
        }),
  };

  // Merge toolbar action
  const mergedToolbarAction =
    toolbarAction ||
    (!createMutation
      ? undefined
      : {
          label: t("table.addEntity", { entity: entityName }),
          icon: <Plus className="h-4 w-4" />,
          onClick: handleAdd,
          variant: "default" as const,
        });

        return (
    <Card className="border-none shadow-none py-0 gap-3 bg-transparent">
      <CardContent className="p-0">
        <BaseDataTable
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
          fullColumns={props.fullColumns || props.columns}
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
                ? t("table.entityDetails", { entity: entityName })
                : editingItem
                  ? t("table.editEntity", { entity: entityName })
                  : t("table.addNewEntity", { entity: entityName })
            }
            submitLabel={
              editingItem
                ? t("table.updateEntity", { entity: entityName })
                : t("table.createEntity", { entity: entityName })
            }
            modalSize="md"
            viewMode={isViewMode}
            onSuccess={handleCloseModal}
            disabledFieldsInEdit={disabledFieldsInEdit}
            isEditMode={!!editingItem}
            onFieldChange={(fieldName, value, all) => {
               console.log(name, value, stripHiddenValues(formConfig, all))
            }}
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
            onCommitted={() => refetch()}
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
