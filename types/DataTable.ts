/**
 * DataTable Type Definitions
 * Import these types when using the DataTable component
 */

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { FilterField } from "./filter";
import { DynamicFormConfig } from "@/ui/components/form/type";

/**
 * Custom action configuration that can override or extend built-in actions
 */
export interface CustomAction {
 /** Action type - use built-in types to replace default behavior */
 type: 'edit' | 'view' | 'delete' | 'create' | string;

 /** Placement of the action */
 placement: 'header' | 'cell';

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
 variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
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
 totalPages: number;

 /** Total number of items (for server-side pagination) */
 totalItems: number;

 /** Callback when pagination changes */
 onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;

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

export interface FilterConfig {
 fields?: FilterField[];
 // Layout
 columns?: 1 | 2 | 3 | 4; // Grid columns
 // Behavior
 applyOnChange?: boolean; // Auto-apply on field change
 showResetButton?: boolean;
 showApplyButton?: boolean;
 viewMode?: 'drawer' | 'popover'; // Display mode
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

// operations 
interface Operations<TData = any> {
 formConfig?: DynamicFormConfig; // DynamicFormConfig
 defaultValues?: any;
 getAllData: any;
 createMutation?: any;
 updateMutation?: any;
 deleteMutation?: any;
 queryKey?: any[];
 entityName?: string;
 isViewAvailable?: boolean;
 editTooltip?: string;
 deleteTooltip?: string;
 viewTooltip?: string;
 prepareSubmitData?: (data: TData, isEdit: boolean, originalItem?: TData) => any;
 transformEditData?: (item: TData) => any;
 openInside?: "modal" | "drawer";
}

/**
 * Main DataTable component props
 */
export interface DataTableProps<TData, TValue = any> {
 cardTitle: string | ((length: number) => string);
 defaultPageSize?: number;
 pageSizes?: number[];
 filterConfig?: FilterConfig;
 columns: ColumnDef<TData, TValue>[];
 selectable?: boolean;
 searchConfig?: DataTableSearchConfig;
 enableSorting?: boolean;
 defaultColumnVisibility?: VisibilityState;
 enableColumnVisibility?: boolean;
 enableRowHover?: boolean;
 rowClassName?: string | ((row: TData) => string);
 toolbarAction?: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
 };
 data?: TData[];
 operations?: Operations<TData>;
 /** Custom actions that can override or extend built-in actions */
 customActions?: CustomAction[];
}

export interface BaseDataTableProps<TData, TValue = any> {
 data: TData[];
 columns: ColumnDef<TData, TValue>[];
 isLoading: boolean;
 pagination?: DataTablePagination;
 filterConfig?: FilterConfig;
 actions?: DataTableAction;
 onEdit?: (row: TData) => void;
 onView?: (row: TData) => void;
 onDelete?: (row: TData) => void;
 toolbarAction?: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
 };
 selectable?: boolean;
 searchConfig?: DataTableSearchConfig;
 rowClassName?: string | ((row: TData) => string);
 enableSorting?: boolean;
 enableColumnVisibility?: boolean;
 defaultColumnVisibility?: VisibilityState;
 enableRowHover?: boolean;
 onSelectionChange?: (selectedRows: TData[]) => void;
 /** Custom actions that can override or extend built-in actions */
 customActions?: CustomAction[];
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
