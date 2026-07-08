// coding-standard: maintained
import { useAuthStore } from '@/services/stores';

/**
 * Permission strings mirror the backend catalog
 * (easystock-backend `src/constants/permissions.ts`).
 */
export const PERMISSIONS = {
  /** Unit costs / COGS figures shown in detail views. */
  costsView: 'costs.view',
} as const;

/** Whether the signed-in user's role grants the given permission. */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}
