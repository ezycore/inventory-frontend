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
 optionsApi?: string; // API endpoint to fetch options dynamically
 /**
  * Selection mode for `select` fields. Defaults to "single".
  *
  * "multiple" emits an array, which the query builder joins with commas — the
  * shape the backend's OR filters take (e.g. products `?tags=a,b`).
  */
 mode?: "single" | "multiple";
 // Validation
 min?: number;
 max?: number;
 // Conditional visibility
 dependsOn?: string;
 showWhen?: (values: Record<string, any>) => boolean;
}

export interface FilterValues {
 [key: string]: any;
}
