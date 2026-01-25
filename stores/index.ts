// Export all Zustand stores for SRS-based system
export { useAuthStore } from './use-auth-store'
export { useUIStore } from './use-ui-store'
export { useSettingsStore } from './use-settings-store'

// Export types for convenience
export type { User } from './use-auth-store'
export type { Theme, Notification } from './use-ui-store'

// Export store utilities
export * from './store-utils'
