// Export all Zustand stores for SRS-based system
export { useAuthStore } from "./use-auth-store";
export { useUIStore } from "./use-ui-store";

// Export sell page store
export { useSellPageStore } from "./sell-page-store";
export type { 
  CustomerSelectOption, 
  ProductSelectOption, 
  SellOrderItem 
} from "./sell-page-store";

// Export types for convenience
export type { User } from "./use-auth-store";
export type { Notification, Theme } from "./use-ui-store";

// Export store utilities
export * from "./store-utils";
