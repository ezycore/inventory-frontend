/**
 * Dependency Evaluation Utilities
 * 
 * Handles unified field dependency logic for dynamic forms
 */

import type { FieldDependency, FieldDependencyConfig } from './type';

/**
 * Extract value from an object using a property path
 * Handles nested properties and complex objects like select options
 * 
 * @param obj - The object to extract from
 * @param prop - Property name to extract (e.g., '_id', 'value', 'label')
 * @returns Extracted value or the original object if prop not found
 */
export const extractValue = (obj: any, prop?: string): any => {
  if (!obj) return obj;
  if (!prop) return obj;
  
  // Handle nested properties (e.g., 'user.id')
  if (prop.includes('.')) {
    return prop.split('.').reduce((acc, part) => acc?.[part], obj);
  }
  
  // Direct property access
  return obj[prop] !== undefined ? obj[prop] : obj;
};

/**
 * Evaluate a dependency condition
 * 
 * @param watchedValue - The current value of the watched field
 * @param dependency - Dependency configuration
 * @returns true if condition is met, false otherwise
 */
export const evaluateDependencyCondition = (
  watchedValue: any,
  dependency: FieldDependency
): boolean => {
  const { matchWithProp, condition = 'eq', value: compareValue } = dependency;
  
  // Extract actual value if matchWithProp is specified
  const actualValue = extractValue(watchedValue, matchWithProp);
  
  // Handle different conditions
  switch (condition) {
    case 'eq':
      return actualValue === compareValue;
      
    case 'ne':
      return actualValue !== compareValue;
      
    case 'gt':
      return Number(actualValue) > Number(compareValue);
      
    case 'gte':
      return Number(actualValue) >= Number(compareValue);
      
    case 'lt':
      return Number(actualValue) < Number(compareValue);
      
    case 'lte':
      return Number(actualValue) <= Number(compareValue);
      
    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(actualValue);
      
    case 'notIn':
      return Array.isArray(compareValue) && !compareValue.includes(actualValue);
      
    case 'truthy':
      // Check for truly empty values
      if (actualValue === null || actualValue === undefined) return false;
      if (typeof actualValue === 'string' && actualValue.trim() === '') return false;
      if (Array.isArray(actualValue) && actualValue.length === 0) return false;
      return Boolean(actualValue);
      
    case 'falsy':
      // Opposite of truthy
      if (actualValue === null || actualValue === undefined) return true;
      if (typeof actualValue === 'string' && actualValue.trim() === '') return true;
      if (Array.isArray(actualValue) && actualValue.length === 0) return true;
      return !Boolean(actualValue);
      
    default:
      console.warn(`Unknown dependency condition: ${condition}`);
      return false;
  }
};

/**
 * Apply dependency action to determine field state
 * 
 * @param conditionMet - Whether the dependency condition is met
 * @param action - Action to take ('disable' | 'hide' | 'show' | 'enable')
 * @returns Object with shouldHide and shouldDisable flags
 */
export const applyDependencyAction = (
  conditionMet: boolean,
  action: FieldDependency['action'] = 'disable'
): { shouldHide: boolean; shouldDisable: boolean } => {
  switch (action) {
    case 'disable':
      // Disable when condition is NOT met
      return { shouldHide: false, shouldDisable: !conditionMet };
      
    case 'enable':
      // Enable when condition is met (disable when not met)
      return { shouldHide: false, shouldDisable: !conditionMet };
      
    case 'hide':
      // Hide when condition is NOT met
      return { shouldHide: !conditionMet, shouldDisable: false };
      
    case 'show':
      // Show when condition is met (hide when not met)
      return { shouldHide: !conditionMet, shouldDisable: false };
      
    default:
      return { shouldHide: false, shouldDisable: false };
  }
};

/**
 * Main function to evaluate field dependency and return its state
 * 
 * @param watchedValue - Current value of the watched field
 * @param dependency - Dependency configuration
 * @returns Object with shouldHide and shouldDisable flags
 */
export const evaluateFieldDependency = (
  watchedValue: any,
  dependency?: FieldDependency
): { shouldHide: boolean; shouldDisable: boolean } => {
  if (!dependency) {
    return { shouldHide: false, shouldDisable: false };
  }
  
  const conditionMet = evaluateDependencyCondition(watchedValue, dependency);
  return applyDependencyAction(conditionMet, dependency.action);
};

/**
 * Normalize a dependency config (single or array) into an array.
 *
 * @param dependency - Single condition, array of conditions, or undefined
 * @returns Array of dependency conditions (empty when none configured)
 */
export const normalizeDependencies = (
  dependency?: FieldDependencyConfig
): FieldDependency[] => {
  if (!dependency) return [];
  return Array.isArray(dependency) ? dependency : [dependency];
};

/**
 * Evaluate a group of dependencies with AND semantics — every condition must
 * pass for the group to be considered met. The resulting action is taken from
 * the FIRST dependency (the group shares one show/hide/disable intent).
 *
 * @param watchedValues - Watched values aligned by index with `dependencies`
 * @param dependencies - Normalized dependency conditions
 * @returns Object with shouldHide and shouldDisable flags
 */
export const evaluateFieldDependencies = (
  watchedValues: any[],
  dependencies: FieldDependency[]
): { shouldHide: boolean; shouldDisable: boolean } => {
  if (!dependencies.length) {
    return { shouldHide: false, shouldDisable: false };
  }

  const allMet = dependencies.every((dep, i) =>
    evaluateDependencyCondition(watchedValues[i], dep)
  );
  return applyDependencyAction(allMet, dependencies[0].action);
};

/**
 * Resolve template placeholder in API endpoint
 * Supports {{fieldName}} syntax
 * 
 * @param template - Template string with placeholder (e.g., '/products/{{productId}}/variants')
 * @param values - Object with field values to substitute
 * @returns Resolved URL or null if required value is missing
 * 
 * @example
 * resolveApiTemplate('/products/{{productId}}/variants', { productId: '123' })
 * // Returns: '/products/123/variants'
 */
export const resolveApiTemplate = (
  template: string,
  values: Record<string, any>
): string | null => {
  if (!template) return null;
  
  // Find {{placeholder}} pattern
  const match = template.match(/\{\{([^}]+)\}\}/);

  if (!match) {
    // No placeholder, return as is
    return template;
  }
  
  // Extract field name from {{fieldName}}
  const fieldName = match[1].trim();
  const fieldValue = values[fieldName];
  
  // Extract actual value if it's an object
  let actualValue = fieldValue;
  if (fieldValue && typeof fieldValue === 'object') {
    // Try common properties
    actualValue = fieldValue.value || fieldValue._id || fieldValue.id || fieldValue;
  }
  
  // If value is missing or empty, template cannot be resolved
  if (!actualValue || (typeof actualValue === 'string' && actualValue.trim() === '')) {
    return null;
  }

  // Replace placeholder with actual value
  return template.replace(match[0], String(actualValue));
};

/**
 * Is this field CERTAINLY hidden right now?
 *
 * Used by `FormSectionComponent` to decide whether a section has anything left
 * to show. It answers only when it is sure: `false` means "may be visible", not
 * "is visible", so a section is hidden only when every field is definitely gone.
 *
 * The uncertainty is real and worth being explicit about. `FormField` enriches
 * the primary dependency's value into the full `{ value, label }` option before
 * comparing, and where that option list comes from `optionsApi` it arrives
 * asynchronously — a hook this function cannot call, once per field, from inside
 * a section. So a dependency reading a property off an API-backed select is
 * reported as UNKNOWN and keeps its section alive. Getting that wrong in the
 * other direction would hide a section whose field was about to appear, which is
 * a worse bug than the empty card this exists to prevent.
 *
 * Static `options` need no hook, so those enrich here exactly as the field does.
 */
export const isFieldCertainlyHidden = (
  field: {
    name: string;
    hidden?: boolean;
    hideInEdit?: boolean;
    dependsOn?: FieldDependencyConfig;
  },
  context: {
    isEditMode?: boolean;
    /** Watched value per dependency field name. */
    valueByName: Record<string, any>;
    /** Every field on the form, for looking up a dependency's own config. */
    allFields?: { name: string; type?: string; options?: any[]; optionsApi?: any }[];
  },
): boolean => {
  if (field.hidden) return true;
  if (context.isEditMode && field.hideInEdit) return true;

  const dependencies = normalizeDependencies(field.dependsOn);
  if (!dependencies.length) return false;

  const values = dependencies.map((dep, index) => {
    const raw = context.valueByName[dep.field];
    if (index !== 0 || !raw || typeof raw === "object") return raw;
    const source = context.allFields?.find((f) => f.name === dep.field);
    if (source?.type !== "select") return raw;
    // Static options enrich synchronously, the way the field does.
    if (source.options) {
      return source.options.find((opt) => opt.value === raw) ?? raw;
    }
    // API-backed options do not. Signal uncertainty.
    if (source.optionsApi && dep.matchWithProp) return UNRESOLVED;
    return raw;
  });

  if (values.includes(UNRESOLVED)) return false;
  return evaluateFieldDependencies(values, dependencies).shouldHide;
};

/** Sentinel for a dependency value this module cannot resolve without a hook. */
const UNRESOLVED = Symbol("unresolved-dependency-value");
