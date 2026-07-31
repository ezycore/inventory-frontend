// coding-standard: maintained
import { useAuthStore } from '@/services/stores';

/**
 * Permission strings mirror the backend catalog
 * (easystock-backend `src/constants/permissions.ts`).
 */
export const PERMISSIONS = {
  /** Unit costs / COGS figures shown in detail views. */
  costsView: 'costs.view',
  /** Any write that changes stock — adjust, transfer, assign a lot an expiry. */
  stockManage: 'stock.manage',
  /** User administration; also gates the Roles settings page. */
  usersManage: 'users.manage',
  /** Organization-level settings; also gates the Billing page and its nav entry. */
  organizationEdit: 'organization.edit',
} as const;

/** Whether the signed-in user's role grants the given permission. */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}

/**
 * Whether the user may see and act on billing — the Billing page, and the
 * subscription banner's "Pay now" / "Reactivate" actions (which mint a real
 * payment session, so they are gated, not just hidden).
 *
 * The owner is always allowed: a role can be edited out of `organization.edit`,
 * which would otherwise lock the organization out of its own subscription.
 */
export function useCanManageBilling(): boolean {
  const { user } = useAuthStore();
  const canEditOrganization = useHasPermission(PERMISSIONS.organizationEdit);

  const isOwner =
    !!user?.id &&
    !!user?.organization?.ownerId &&
    user.id === user.organization.ownerId;

  return isOwner || canEditOrganization;
}
