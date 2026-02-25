"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/ui/lib/utils";
import { CardItem, CardEmptyState, CardSkeleton } from "./card-variants";
import { DataCardToolbar } from "./toolbar";
import { DataCardPagination } from "./pagination";
import { EasyAlertDialog } from "@/ui/components/custom/easy-alert-dialog";
import type {
  BaseDataCardProps,
  CardLayout,
  DataCardPagination as PaginationConfig,
} from "@/types/DataCard";

// Grid column classes based on config
const getGridClasses = (columns?: {
  default: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}): string => {
  if (!columns) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }

  const classes: string[] = [];

  // Default
  classes.push(`grid-cols-${columns.default}`);

  // Responsive breakpoints
  if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
  if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
  if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
  if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

  return classes.join(" ");
};

// Gap classes
const gapClasses: Record<string, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export function BaseDataCard<TData extends { _id: string }>({
  data,
  isLoading,
  pagination,
  filterConfig,
  actions,
  onEdit,
  onView,
  onDelete,
  onBulkDelete,
  toolbarAction,
  selectable = false,
  searchConfig,
  onSelectionChange,
  // Layout
  layoutConfig,
  cardSize,
  // Styling
  variant = "default",
  cardClassName,
  enableCardHover = true,
  rounded = "lg",
  shadow = "sm",
  // Custom Rendering
  renderCard,
  // Fields
  fields,
  imageConfig,
  // Custom actions
  customActions,
  // Module
  module,
  // Empty State
  emptyState,
  emptyMessage,
  emptyIcon,
}: BaseDataCardProps<TData>) {
  // Local state
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<CardLayout>(layoutConfig?.layout || "grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync layout state when layoutConfig.layout changes
  useEffect(() => {
    if (layoutConfig?.layout) {
      setLayout(layoutConfig.layout);
    }
  }, [layoutConfig?.layout]);

  // Pagination state - use first option from pageSizeOptions as default
  const defaultPageSize = pagination?.pageSizeOptions?.[0] ?? pagination?.pageSize ?? 12;
  const [paginationState, setPaginationState] = useState({
    pageIndex: pagination?.pageIndex ?? 0,
    pageSize: pagination?.pageSize ?? defaultPageSize,
  });

  // Filter data based on global search
  const filteredData = useMemo(() => {
    if (!globalFilter || !data) return data;

    const searchLower = globalFilter.toLowerCase();

    // If specific searchable key is provided
    if (searchConfig?.searchableKey) {
      return data.filter((item) => {
        const value = item[searchConfig.searchableKey as keyof TData];
        return String(value || "").toLowerCase().includes(searchLower);
      });
    }

    // Global search across all string fields or configured fields
    return data.filter((item) => {
      // Search in configured fields first
      if (fields && fields.length > 0) {
        return fields.some((field) => {
          const value = getNestedValue(item, field.key as string);
          return String(value || "").toLowerCase().includes(searchLower);
        });
      }

      // Fallback: search all string values
      return Object.values(item).some((value) =>
        String(value || "").toLowerCase().includes(searchLower)
      );
    });
  }, [data, globalFilter, searchConfig, fields]);

  // Client-side pagination (if not manual)
  const paginatedData = useMemo(() => {
    if (pagination?.manualPagination) {
      return filteredData;
    }

    const start = paginationState.pageIndex * paginationState.pageSize;
    const end = start + paginationState.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, paginationState, pagination?.manualPagination]);

  // Selection handlers
  const handleSelect = useCallback(
    (id: string, selected: boolean) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    },
    []
  );

  // Notify parent of selection changes
  useMemo(() => {
    if (onSelectionChange && data) {
      const selected = data.filter((item) => selectedIds.has(item._id));
      onSelectionChange(selected);
    }
  }, [selectedIds, data, onSelectionChange]);

  // Delete handlers
  const openDeleteDialog = useCallback((item: TData) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(itemToDelete);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, onDelete]);

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (onBulkDelete && selectedIds.size > 0) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [onBulkDelete, selectedIds]);

  // Pagination change handler
  const handlePaginationChange = useCallback(
    (newPagination: { pageIndex: number; pageSize: number }) => {
      setPaginationState(newPagination);
      pagination?.onPaginationChange?.(newPagination);
    },
    [pagination]
  );

  // Layout change handler
  const handleLayoutChange = useCallback((newLayout: CardLayout) => {
    setLayout(newLayout);
  }, []);

  // Get layout-specific grid classes
  const layoutClasses = useMemo(() => {
    if (layout === "list") {
      return "flex flex-col gap-2";
    }
    if (layout === "masonry") {
      return cn(
        "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
        gapClasses[layoutConfig?.gap || "md"]
      );
    }
    // Grid layout
    return cn(
      "grid",
      getGridClasses(layoutConfig?.columns),
      gapClasses[layoutConfig?.gap || "md"]
    );
  }, [layout, layoutConfig]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <DataCardToolbar
          searchConfig={searchConfig}
          filterConfig={filterConfig}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          selectable={selectable}
          hasSelection={selectedIds.size > 0}
          selectedRowsCount={selectedIds.size}
          deletable={!!actions?.deletable}
          onBulkDelete={handleBulkDelete}
          isDeleting={isDeleting}
          actionButton={toolbarAction}
          customActions={customActions}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
        <div className={layoutClasses}>
          <CardSkeleton variant={variant} count={paginationState.pageSize} />
        </div>
      </div>
    );
  }

  // Render empty state
  if (!paginatedData || paginatedData.length === 0) {
    return (
      <div className="w-full space-y-6">
        <DataCardToolbar
          searchConfig={searchConfig}
          filterConfig={filterConfig}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          selectable={selectable}
          hasSelection={selectedIds.size > 0}
          selectedRowsCount={selectedIds.size}
          deletable={!!actions?.deletable}
          onBulkDelete={handleBulkDelete}
          isDeleting={isDeleting}
          actionButton={toolbarAction}
          customActions={customActions}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
        <CardEmptyState message={emptyMessage} icon={emptyIcon}>
          {emptyState}
        </CardEmptyState>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toolbar */}
      <DataCardToolbar
        searchConfig={searchConfig}
        filterConfig={filterConfig}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        selectable={selectable}
        hasSelection={selectedIds.size > 0}
        selectedRowsCount={selectedIds.size}
        deletable={!!actions?.deletable}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
        actionButton={toolbarAction}
        customActions={customActions}
        layout={layout}
        onLayoutChange={handleLayoutChange}
      />

      {/* Cards Grid */}
      <div className={layoutClasses}>
        {paginatedData.map((item) => (
          <div
            key={item._id}
            className={layout === "masonry" ? "break-inside-avoid mb-4" : ""}
          >
            <CardItem
              data={item}
              variant={variant}
              cardSize={cardSize}
              cardClassName={
                typeof cardClassName === "function"
                  ? cardClassName(item)
                  : cardClassName
              }
              enableCardHover={enableCardHover}
              rounded={rounded}
              shadow={shadow}
              fields={fields}
              imageConfig={imageConfig}
              actions={actions}
              onEdit={onEdit ? () => onEdit(item) : undefined}
              onView={onView ? () => onView(item) : undefined}
              onDelete={onDelete ? () => openDeleteDialog(item) : undefined}
              customActions={customActions}
              selected={selectedIds.has(item._id)}
              onSelect={(selected) => handleSelect(item._id, selected)}
              selectable={selectable}
              renderCard={renderCard}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <DataCardPagination
        pagination={pagination}
        paginationState={paginationState}
        onPaginationChange={handlePaginationChange}
        selectable={selectable}
        selectedRowsCount={selectedIds.size}
        totalItems={filteredData.length}
      />

      {/* Delete Confirmation Dialog */}
      <EasyAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the selected item."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      />
    </div>
  );
}

// Helper function to get nested values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}
