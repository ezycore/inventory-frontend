/**
 * Utility hooks that can be used across any module
 * 
 * These hooks are module-independent and provide common functionality
 * that can be shared across different parts of the application.
 * 
 * Examples:
 * - Products module: useSelectOptions('/api/categories')
 * - Users module: useSelectOptions('/api/roles') 
 * - Settings module: useSelectOptions('/api/languages')
 * - Inventory module: useSelectOptions('/api/warehouses')
 */

export { useSelectOptions } from './use-select-options'