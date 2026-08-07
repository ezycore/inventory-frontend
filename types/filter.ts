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
 /**
  * API endpoint to fetch options dynamically.
  *
  * Supports the same `{{fieldName}}` template the form selects use, resolved
  * against the CURRENT FILTER VALUES (e.g. `?parentId={{categoryId}}`). Until
  * the referenced filter has a value the template cannot resolve, so no request
  * is made and the control renders disabled.
  */
 optionsApi?: string;
 /**
  * Filters to reset to their default whenever this field changes.
  *
  * For dependent pairs: a sub-category only exists under one category, so
  * changing the category must drop the stale child — otherwise `pickActive`
  * keeps sending it and the list filters on a pair that cannot co-exist.
  * Mirrors `clearFieldsOnChange` on the form-field config.
  */
 clearFieldsOnChange?: string[];
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
