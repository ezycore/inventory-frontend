export type FilterFieldType =
 | "text"
 | "select"
 | "checkbox"
 | "date"
 | "date-range"
 | "number"
 | "number-range"
 | "boolean";

export interface FilterOption {
 label: string;
 value: string | number | boolean;
}

export interface FilterField {
 name: string;
 label: string;
 type: FilterFieldType;
 placeholder?: string;
 options?: FilterOption[]; // For select/multi-select
 defaultValue?: any;
 // Layout
 columnSpan?: number; // Number of columns to span (1-4)
 // For API field mapping
 apiKey?: string; // Map to different API parameter name
 // Validation
 min?: number;
 max?: number;
 // Conditional visibility
 dependsOn?: string;
 showWhen?: (values: Record<string, any>) => boolean;
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

export interface FilterValues {
 [key: string]: any;
}
