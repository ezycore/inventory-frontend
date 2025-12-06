/**
 * DataTable Type Definitions
 * Import these types when using the DataTable component
 */

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { FilterField } from "./filter";

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
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
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
 totalPages?: number;

 /** Total number of items (for server-side pagination) */
 totalItems?: number;

 /** Callback when pagination changes */
 onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;

 /** Enable server-side pagination */
 manualPagination?: boolean;

 /** Indicates if there is a next page (from backend) */
 hasNext?: boolean;

 /** Indicates if there is a previous page (from backend) */
 hasPrev?: boolean;

 /** Available page size options */
 pageSizeOptions?: number[];
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

export interface FilterConfig {
 fields: FilterField[];
 // Layout
 columns?: 1 | 2 | 3 | 4; // Grid columns
 // Behavior
 applyOnChange?: boolean; // Auto-apply on field change
 showResetButton?: boolean;
 showApplyButton?: boolean;
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

 /** TanStack Query key for caching */
 queryKey: any[];

 /** Default page size */
 defaultPageSize?: number;

 /** Available page size options */
 pageSizeOptions?: number[];
}

/**
 * Main DataTable component props
 */
export interface DataTableProps<TData, TValue = any> {
 cardTitle?: string | ((dataLength: number) => string);
 /** Column definitions */
 columns: ColumnDef<TData, TValue>[];

 //filter
 filterConfig?: FilterConfig;

 /** 
  * API configuration for self-contained mode
  * When provided, table manages its own data fetching, pagination, and filters
  */
 apiConfig?: DataTableApiConfig<TData>;

 /** 
  * Array of data to display (legacy mode)
  * Only required when apiConfig is not provided
  */
 data?: TData[];

 // Selection
 /** Enable row selection checkboxes */
 selectable?: boolean;

 /** Callback when selection changes */
 onSelectionChange?: (selectedRows: TData[]) => void;

 // Search
 /** Search configuration */
 searchConfig?: DataTableSearchConfig<TData>;

 // Actions
 /** Action buttons configuration */
 actions?: DataTableAction;

 /** Edit handler */
 onEdit?: (row: TData) => void;

 /** Delete handler (can be async) */
 onDelete?: (row: TData) => void | Promise<void>;

 /** View handler */
 onView?: (row: TData) => void;

 // Integrated CRUD support (optional - auto-wires with form modal)
 /** 
  * Enable integrated CRUD operations
  * When provided, DataTable will handle add/edit/view/delete with modal forms
  */
 crud?: {
  /** Form configuration for DynamicForm */
  formConfig: any; // DynamicFormConfig

  /** Create mutation hook (from TanStack Query) */
  createMutation?: any;

  /** Update mutation hook (from TanStack Query) */
  updateMutation?: any;

  /** Delete mutation hook (from TanStack Query) */
  deleteMutation?: any;

  /** Entity name (e.g., "Brand", "Product") for toast messages */
  entityName?: string;

  /** Query key for cache invalidation */
  queryKey?: any[];

  /** Custom data preparation before submit */
  prepareSubmitData?: (data: any, isEdit: boolean, originalItem?: TData) => any;

  /** Transform backend data to form format for edit mode */
  transformEditData?: (item: TData) => any;

  /** Custom default form values */
  defaultValues?: any;

  /** Disable specific operations */
  disableAdd?: boolean;
  disableEdit?: boolean;
  disableView?: boolean;
  disableDelete?: boolean;
 };

 // Pagination
 /** 
  * Pagination configuration (legacy mode)
  * Only required when apiConfig is not provided
  * When apiConfig is provided, pagination is managed internally
  */
 pagination?: DataTablePagination;

 // Loading state
 /** Show loading spinner */
 isLoading?: boolean;

 // Additional features
 /** Enable column sorting */
 enableSorting?: boolean;

 /** Enable column visibility toggle */
 enableColumnVisibility?: boolean;

 /** Default column visibility state */
 defaultColumnVisibility?: VisibilityState;

 /** Enable row hover effects */
 enableRowHover?: boolean;

 // Toolbar
 /** Custom action button in toolbar (e.g., Add New) */
 toolbarAction?: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
 };

 // Styling
 /** Custom CSS class for table container */
 className?: string;

 /** Custom CSS class for rows (can be function) */
 rowClassName?: string | ((row: TData) => string);
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
