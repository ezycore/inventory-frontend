/**
 * DataCard Type Definitions
 * Import these types when using the DataCard component
 */

import { DynamicFormConfig } from "@/ui/components/form/type";
import { FilterField } from "./filter";
import { SortingConfig } from "./DataTable";

/**
 * Sort option for card sorting
 */
export interface CardSortOption {
  /** Field name to sort by */
  field: string;
  /** Display label */
  label: string;
}

/**
 * Sorting configuration for DataCard
 */
export interface CardSortingConfig {
  /** Available sort options */
  sortOptions: CardSortOption[];
  /** Default sort field */
  defaultSortBy?: string;
  /** Default sort order */
  defaultSortOrder?: "asc" | "desc";
}

/**
 * Card layout configuration
 */
export type CardLayout = "grid" | "list";
export type CardVariant = "default" | "compact" | "detailed";
export type CardSize = "sm" | "md" | "lg";

export interface CardLayoutConfig {
  /** Layout type for displaying cards */
  layout?: CardLayout;
  /** Number of columns for grid layout */
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between cards */
  gap?: "sm" | "md" | "lg";
}

/**
 * Custom action configuration for cards
 */
export interface CardCustomAction {
  /** Action type - use built-in types to replace default behavior */
  type: "edit" | "view" | "delete" | "create" | string;

  /** Placement of the action */
  placement: "header" | "footer" | "menu";

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

  /** Disabled state */
  disabled?: boolean | ((row: any) => boolean);
}

/**
 * Configuration for card actions (edit, delete, view, custom)
 */
export interface DataCardAction {
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
 * Configuration for card pagination
 */
export interface DataCardPagination {
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
 * Configuration for card search
 */
export interface DataCardSearchConfig<TData = any> {
  /** Specific key to search */
  searchableKey?: keyof TData;

  /** Placeholder text for search input */
  placeholder?: string;

  /** Enable global search across all fields */
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
  viewMode?: "drawer" | "popover"; // Display mode
  // Initial values (e.g., from URL params)
  initialValues?: Record<string, any>;
  // Callbacks
  onApply?: (filters: Record<string, any>) => void;
  onReset?: () => void;
}

/**
 * Card field configuration for default card variants
 */
export interface CardFieldConfig<TData = any> {
  /** Field key from data */
  key: keyof TData | string;
  /** Display label */
  label?: string;
  /** Custom render function */
  render?: (value: any, row: TData) => React.ReactNode;
  /** Show in card header */
  isTitle?: boolean;
  /** Show in card subtitle */
  isSubtitle?: boolean;
  /** Show as badge */
  isBadge?: boolean;
  /** Badge variant based on value */
  badgeVariant?: (
    value: any,
  ) => "default" | "secondary" | "destructive" | "outline";
  /** Show in footer */
  inFooter?: boolean;
  /** Hide this field */
  hidden?: boolean;
  /** Column span in grid layout (1-2) */
  span?: 1 | 2;
}

/**
 * Image configuration for cards
 */
export interface CardImageConfig<TData = any> {
  /** Field key for image source */
  src: keyof TData | ((row: TData) => string);
  /** Alt text field or static text */
  alt?: keyof TData | string;
  /** Aspect ratio */
  aspectRatio?: "square" | "video" | "wide" | "portrait";
  /** Fallback image or initials */
  fallback?: React.ReactNode | ((row: TData) => React.ReactNode);
  /** Show image as avatar */
  asAvatar?: boolean;
  /** Position in card */
  position?: "top" | "left" | "right" | "background";
}

// Operations interface (same as DataTable)
interface Operations<TData = any> {
  formConfig?: DynamicFormConfig;
  defaultValues?: any;
  getAllData?: any;
  createMutation?: any;
  updateMutation?: any;
  deleteMutation?: any;
  bulkDeleteMutation?: any;
  queryKey?: any[];
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
}

/**
 * Main DataCard component props
 */
export interface DataCardProps<TData, TValue = any> {
  /** Card/section title */
  cardTitle?: string | ((length: number) => string);
  /** Default page size */
  defaultPageSize?: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Filter configuration */
  filterConfig?: FilterConfig;
  /** Enable selection */
  selectable?: boolean;
  /** Search configuration */
  searchConfig?: DataCardSearchConfig;
  /** Server-side sorting configuration. Renders a sort dropdown in the toolbar */
  sortingConfig?: SortingConfig;
  /** Loading state */
  loading?: boolean;

  // Card Layout Configuration
  /** Layout configuration for cards */
  layoutConfig?: CardLayoutConfig;
  /** Card size variant */
  cardSize?: CardSize;

  // Card Styling
  /** Built-in card variant */
  variant?: CardVariant;
  /** Custom card className */
  cardClassName?: string | ((row: TData) => string);
  /** Enable card hover effect */
  enableCardHover?: boolean;
  /** Custom card border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Card shadow */
  shadow?: "none" | "sm" | "md" | "lg";

  // Custom Rendering
  /** Completely custom card render function */
  renderCard?: (
    row: TData,
    actions: {
      onEdit?: () => void;
      onView?: () => void;
      onDelete?: () => void;
    },
  ) => React.ReactNode;

  /** Custom loading card render function – shown in place of the default skeleton */
  loadingRenderCard?: () => React.ReactNode;

  // Field Configuration (for built-in variants)
  /** Fields to display in cards */
  fields?: CardFieldConfig<TData>[];
  /** Image configuration */
  imageConfig?: CardImageConfig<TData>;

  // Toolbar
  /** Toolbar action button */
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

  // Data
  /** External data source */
  data?: TData[];
  /** CRUD operations configuration */
  operations?: Operations<TData>;
  /** Custom actions that can override or extend built-in actions */
  customActions?: CardCustomAction[];

  // Module
  /**
   * Module name for settings (reserved for future use)
   * @deprecated Not currently implemented - reserved for storing user preferences like column visibility
   */
  module?: string;

  // Empty State
  /** Custom empty state component */
  emptyState?: React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
}

/**
 * Base DataCard component props (internal)
 */
export interface BaseDataCardProps<TData> {
  data: TData[];
  isLoading: boolean;
  /** Page title — rendered inside the toolbar on the left, so title + search + actions occupy a single row */
  title?: string;
  /** True when refetching with existing data (sort/filter/page change) — shows overlay instead of replacing cards */
  isFetching?: boolean;
  pagination?: DataCardPagination;
  filterConfig?: FilterConfig;
  actions?: DataCardAction;
  /** Current sort field */
  sortBy?: string;
  /** Current sort order */
  sortOrder?: "asc" | "desc";
  /** Callback when sort changes */
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  /** Sorting configuration for rendering the sort dropdown */
  sortingConfig?: SortingConfig;
  onEdit?: (row: TData) => void;
  onView?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
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
  searchConfig?: DataCardSearchConfig;
  onSelectionChange?: (selectedRows: TData[]) => void;

  // Layout
  layoutConfig?: CardLayoutConfig;
  cardSize?: CardSize;

  // Styling
  variant?: CardVariant;
  cardClassName?: string | ((row: TData) => string);
  enableCardHover?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg";

  // Custom Rendering
  renderCard?: (
    row: TData,
    actions: {
      onEdit?: () => void;
      onView?: () => void;
      onDelete?: () => void;
    },
  ) => React.ReactNode;

  /** Custom loading card render function – shown in place of the default skeleton */
  loadingRenderCard?: () => React.ReactNode;

  // Fields (for built-in variants)
  fields?: CardFieldConfig<TData>[];
  imageConfig?: CardImageConfig<TData>;

  // Custom actions
  customActions?: CardCustomAction[];

  // Module (reserved for future use - not currently implemented)
  module?: string;

  // Empty State
  emptyState?: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

/**
 * Card item props for individual card rendering
 */
export interface CardItemProps<TData> {
  data: TData;
  variant?: CardVariant;
  cardSize?: CardSize;
  cardClassName?: string;
  enableCardHover?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg";
  fields?: CardFieldConfig<TData>[];
  imageConfig?: CardImageConfig<TData>;
  actions?: DataCardAction;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  customActions?: CardCustomAction[];
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectable?: boolean;
  renderCard?: (
    row: TData,
    actions: {
      onEdit?: () => void;
      onView?: () => void;
      onDelete?: () => void;
    },
  ) => React.ReactNode;
}
