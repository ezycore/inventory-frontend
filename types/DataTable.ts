// coding-standard: maintained
/**
 * DataTable Type Definitions
 * Import these types when using the DataTable component
 */

import { DynamicFormConfig } from "@/ui/components/form/type";
import type { QueryKey } from "@tanstack/react-query";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { UseFormReturn } from "react-hook-form";
import { FilterField } from "./filter";

/**
 * Table styling configuration for different view styles
 */
export type TableVariant = "default" | "compact" | "relaxed" | "card";
export type RowSpacing = "none" | "sm" | "md" | "lg";

export interface TableStyleConfig {
  /** Overall table style variant */
  variant?: TableVariant;
  /** Hide table header row */
  headless?: boolean;
  /** Remove all borders */
  borderless?: boolean;
  /** Space between rows */
  rowSpacing?: RowSpacing;
  /** Alternating row colors */
  zebra?: boolean;
  /** Rounded row corners (works best with rowSpacing) */
  roundedRows?: boolean;
  /** Sticky header on scroll */
  stickyHeader?: boolean;
}

export interface ImageObject {
  thumbnail: {
    url: string;
    secureUrl: string;
    width: number;
  };
  medium: {
    url: string;
    secureUrl: string;
    width: number;
  };
  original: {
    url: string;
    secureUrl: string;
    width: number;
  };
}
/**
 * Custom action configuration that can override or extend built-in actions
 */
export interface CustomAction {
  /** Action type - use built-in types to replace default behavior */
  type: "edit" | "view" | "delete" | "create" | string;

  /** Placement of the action */
  placement: "header" | "cell";

  /** Link href (for Next.js Link) - takes precedence over onClick */
  href?: string | ((row?: any) => string);

  /** Click handler */
  onClick?: (row?: any) => void;

  /** Icon component */
  icon?: React.ReactNode;

  /** Label text */
  label?: string;

  /** Tooltip text */
  tooltip?: string;

  /** Button variant */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /** Custom render function for complete control over rendering */
  render?: (row?: any) => React.ReactNode;

  disabled?: boolean | ((row: any) => boolean);

  /** Hide the action entirely for rows where this returns true (or when set to true) */
  hidden?: boolean | ((row: any) => boolean);
}

/**
 * Configuration for table actions (edit, delete, view, custom)
 */
export interface DataTableAction {
  /** Show edit button. Can be boolean or object with tooltip */
  editable?: boolean | { tooltip?: string };

  /** Show delete button. Can be boolean or object with tooltip */
  deletable?: boolean | { tooltip?: string };

  /** Show view button. Can be boolean or object with tooltip */
  viewable?: boolean | { tooltip?: string };

  /** Array of custom action buttons */
  custom?: Array<{
    /** Label for the action */
    label: string;

    /** Optional icon component */
    icon?: React.ReactNode;

    /** Optional tooltip text */
    tooltip?: string;

    /** Click handler */
    onClick: (row: any) => void;

    /** Button variant */
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  }>;
}

/**
 * Configuration for table pagination
 */
export interface DataTablePagination {
  /** Current page index (0-based) */
  pageIndex: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages (for server-side pagination) */
  totalPages: number;

  /** Total number of items (for server-side pagination) */
  totalItems: number;

  /** Callback when pagination changes */
  onPaginationChange: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;

  /** Enable server-side pagination */
  manualPagination: boolean;

  /** Indicates if there is a next page (from backend) */
  hasNext: boolean;

  /** Indicates if there is a previous page (from backend) */
  hasPrev: boolean;

  /** Available page size options */
  pageSizeOptions: number[];
}

/**
 * Configuration for table search
 */
export interface DataTableSearchConfig<TData = any> {
  /** Specific column to search (column-specific search) */
  searchableColumn?: keyof TData;

  /** Placeholder text for search input */
  placeholder?: string;

  /** Enable global search across all columns */
  globalSearch?: boolean;
}

/**
 * Configuration for server-side sorting
 * When provided, sorting is handled by the backend instead of client-side TanStack Table sorting
 */
export interface SortOption {
  /** The backend field name to sort by */
  field: string;
  /** Display label for the sort option */
  label: string;
}

export interface SortingConfig {
  /** Available sort options (field name → display label) */
  sortOptions: SortOption[];
  /** Default sort field */
  defaultSortBy?: string;
  /** Default sort order */
  defaultSortOrder?: "asc" | "desc";
}

export interface FilterConfig {
  fields?: FilterField[];
  // Layout
  columns?: 1 | 2 | 3 | 4; // Grid columns
  // Behavior
  applyOnChange?: boolean; // Auto-apply on field change
  showResetButton?: boolean;
  showApplyButton?: boolean;
  viewMode?: "drawer" | "popover"; // Display mode
  // Initial values (e.g., from URL params)
  initialValues?: Record<string, any>;
  // Callbacks
  onApply?: (filters: Record<string, any>) => void;
  onReset?: () => void;
}

/**
 * API configuration for self-contained data fetching
 */
export interface DataTableApiConfig<TData = any> {
  /** API endpoint object with getAll method */
  endpoint: {
    getAll: (params: any) => Promise<any>;
  };

  /** TanStack Query key for caching — always from `services/api/query-keys.ts`, never a literal. */
  queryKey: QueryKey;

  /** Default page size */
  defaultPageSize?: number;

  /** Available page size options */
  pageSizeOptions?: number[];
}

// operations
/**
 * The CRUD contract a list page hands its view. **Shared by DataTable AND
 * DataCard** — a page using the ViewToggle passes ONE `operations` object to
 * both, so they must agree on every key. `types/DataCard.ts` kept a private
 * copy labelled "same as DataTable" until 2026-08-07; it had silently drifted,
 * and the missing `onFieldChange` disabled every cross-field rule in card view.
 */
export interface Operations<TData = any> {
  formConfig?: DynamicFormConfig; // DynamicFormConfig
  defaultValues?: any;
  getAllData?: any;
  createMutation?: any;
  updateMutation?: any;
  deleteMutation?: any;
  bulkDeleteMutation?: any;
  queryKey?: QueryKey;
  entityName?: string;
  isViewAvailable?: boolean;
  editTooltip?: string;
  deleteTooltip?: string;
  viewTooltip?: string;
  prepareSubmitData?: (
    data: TData,
    isEdit: boolean,
    originalItem?: TData,
  ) => any;
  transformEditData?: (item: TData) => any;
  openInside?: "modal" | "drawer";
  disabledFieldsInEdit?: string[];
  /**
   * Fires on every field change in the CRUD form. `form` is the DataTable's own
   * `useForm` instance, handed over so a caller can express a cross-field rule
   * (e.g. prefill the VAT rate from the chosen category) — the form is created
   * inside the DataTable, so without it the caller has no `setValue`.
   */
  onFieldChange?: (
    fieldName: string,
    value: any,
    allValues: any,
    form: UseFormReturn<any>,
  ) => void;
}

/**
 * CSV export configuration. When provided, the DataTable renders an "Export"
 * button that calls `download` with the current list query params (active
 * filters + server sort). Actual URL/param building lives in the resource's
 * API module so the export honours the same filters as the list.
 */
/**
 * One selectable export choice shown in the export dialog. Its `params` are
 * merged into the download query, so a choice can pick a dataset
 * (`{ dataset: "batch" }`), a column preset (`{ columns: "essential" }`), or
 * both. When a config omits `options`, the dialog offers a default
 * All-columns / Essential-columns pair.
 */
export interface ExportOption {
  key: string;
  label: string;
  description?: string;
  params?: Record<string, unknown>;
}

export interface DataTableExportConfig {
  download: (params: Record<string, unknown>) => Promise<void>;
  /** Button label (default "Export CSV"). */
  label?: string;
  /** Extra caveat line shown in the export confirm dialog (e.g. scope note). */
  note?: string;
  /** Selectable export choices (dataset / column preset). Defaults to All/Essential. */
  options?: ExportOption[];
}

/**
 * Result of a CSV import run (mirrors the backend ImportResult). `errors` is
 * capped server-side; `invalid` holds the true count.
 */
export interface ImportRowError {
  row: number;
  errors: string[];
}

/** One expected column's header-resolution outcome (mirrors the backend). */
export interface ImportHeaderColumn {
  header: string;
  required?: boolean;
  /** CSV header this column reads from, or null when nothing matched. */
  matched: string | null;
}

/**
 * Header-resolution report returned on preview — drives the column-mapping
 * step when the user's CSV headers differ from the template.
 */
export interface ImportHeaderInfo {
  csvHeaders: string[];
  columns: ImportHeaderColumn[];
}

/** Explicit `expected header → CSV header` overrides from the mapping step. */
export type ImportColumnMapping = Record<string, string>;

export interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  skipped: number;
  created: number;
  committed: boolean;
  /** Present on preview responses; feeds the column-mapping step. */
  headerInfo?: ImportHeaderInfo;
  errors: ImportRowError[];
  /** Aggregated non-fatal skip notices ("message (N rows)"). */
  warnings?: string[];
}

/**
 * Import configuration. When provided, the DataTable renders an "Import" button
 * that opens a dialog: download template → upload → dry-run preview → commit,
 * with an inline column-mapping step when the file's headers don't match.
 * The three callbacks map to the resource's API module; on commit the table
 * refetches automatically.
 */
export interface DataTableImportConfig {
  downloadTemplate: () => Promise<void>;
  preview: (file: File, mapping?: ImportColumnMapping) => Promise<ImportResult>;
  commit: (file: File, mapping?: ImportColumnMapping) => Promise<ImportResult>;
  /** Button label (default "Import"). */
  label?: string;
}

/**
 * Print configuration. When provided, the DataTable renders a "Print" button
 * that prints the rows currently loaded (the visible page) using the given
 * columns. Print columns are a curated subset — independent of table columns.
 */
export interface DataTablePrintColumn<TData = any> {
  header: string;
  value: (row: TData) => unknown;
}
export interface DataTablePrintConfig<TData = any> {
  columns: DataTablePrintColumn<TData>[];
  /** Heading printed above the table + document title. */
  title?: string;
  /** Button label (default "Print"). */
  label?: string;
}

/**
 * Main DataTable component props
 */
export interface DataTableProps<TData, TValue = any> {
  cardTitle?: string | ((length: number) => string);
  defaultPageSize?: number;
  pageSizes?: number[];
  filterConfig?: FilterConfig;
  columns: ColumnDef<TData, TValue>[];
  selectable?: boolean;
  searchConfig?: DataTableSearchConfig;
  enableSorting?: boolean;
  fullColumns?: ColumnDef<TData, TValue>[];
  /** Server-side sorting configuration. When provided, sorting clicks on column headers trigger backend requests instead of client-side sorting */
  sortingConfig?: SortingConfig;
  defaultColumnVisibility?: VisibilityState;
  enableColumnVisibility?: boolean;
  enableRowHover?: boolean;
  rowClassName?: string | ((row: TData) => string);
  loading?: boolean;
  /** Table styling configuration */
  variant?: TableVariant;
  headless?: boolean;
  borderless?: boolean;
  rowSpacing?: RowSpacing;
  zebra?: boolean;
  roundedRows?: boolean;
  stickyHeader?: boolean;
  /** Custom row background color */
  rowBgColor?: string | ((row: TData) => string);
  toolbarAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  };
  data?: TData[];
  operations?: Operations<TData>;
  /** CSV export button config (server-side, honours current filters) */
  exportConfig?: DataTableExportConfig;
  /** CSV import button config (dialog: template → upload → preview → commit) */
  importConfig?: DataTableImportConfig;
  /** Print button config (prints currently loaded rows) */
  printConfig?: DataTablePrintConfig<TData>;
  /** Custom actions that can override or extend built-in actions */
  customActions?: CustomAction[];
  /** Enable column management settings */
  manageColumns?: boolean;
  /** Module name for column settings (required if manageColumns is true) */
  module?: string;
  /** Callback when row selection changes */
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export interface BaseDataTableProps<TData, TValue = any> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  isLoading: boolean;
  /** Page title — rendered inside the toolbar on the left, so title + search + actions occupy a single row */
  title?: string;
  /** True when refetching with existing data (sort/filter/page change) — shows overlay instead of replacing rows */
  isFetching?: boolean;
  pagination?: DataTablePagination;
  filterConfig?: FilterConfig;
  actions?: DataTableAction;
  onEdit?: (row: TData) => void;
  onView?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  /** Server-side sorting: when true, disables client-side sorting model */
  manualSorting?: boolean;
  /** Current server-side sorting state */
  sortingState?: { id: string; desc: boolean }[];
  /** Callback when sorting changes (for server-side sorting) */
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;
  /** Column IDs/accessorKeys that support server-side sorting. Columns not in this list will have sorting disabled when manualSorting is true. */
  serverSortableFields?: string[];
  toolbarAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  };
  selectable?: boolean;
  searchConfig?: DataTableSearchConfig;
  rowClassName?: string | ((row: TData) => string);
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  defaultColumnVisibility?: VisibilityState;
  enableRowHover?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  /** Table styling configuration */
  variant?: TableVariant;
  headless?: boolean;
  borderless?: boolean;
  rowSpacing?: RowSpacing;
  zebra?: boolean;
  roundedRows?: boolean;
  stickyHeader?: boolean;
  /** Custom row background color */
  rowBgColor?: string | ((row: TData) => string);
  /** Custom actions that can override or extend built-in actions */
  customActions?: CustomAction[];
  /** Enable column management settings */
  manageColumns?: boolean;
  /** Module name for column settings (required if manageColumns is true) */
  module?: string;
  /** Full column definitions for settings modal */
  fullColumns?: ColumnDef<TData, TValue>[];
}
/**
 * Example usage:
 *
 * ```tsx
 * import { DataTable } from "@/ui/components/DataTable";
 * import type { DataTableProps, DataTableAction } from "@/ui/components/DataTable.types";
 *
 * interface Product {
 *   id: string;
 *   name: string;
 * }
 *
 * const MyTable: React.FC = () => {
 *   const props: DataTableProps<Product> = {
 *     columns: [...],
 *     data: [...],
 *     selectable: true,
 *   };
 *
 *   return <DataTable {...props} />;
 * };
 * ```
 */
