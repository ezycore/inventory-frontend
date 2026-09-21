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
  /** User administration — placing people in roles. */
  usersManage: 'users.manage',
  /** Reading the org's roles and the permission catalog. */
  rolesView: 'roles.view',
  /**
   * Authoring roles. Deliberately separate from `usersManage`: adding a person
   * to an existing role and rewriting what a role may do are different
   * authorities. `manager` holds `rolesView` and not this.
   */
  rolesManage: 'roles.manage',
  /** Organization-level settings; also feeds the Billing gate below. */
  organizationEdit: 'organization.edit',
  /**
   * Permanently destroying a closed online order. Deliberately NOT part of
   * `storefront.orders.manage`, which is the fulfillment permission `manager`
   * and `staff` both hold — anyone who can confirm an order must not thereby be
   * able to erase one. Admin and super_admin only.
   */
  storefrontOrdersDelete: 'storefront.orders.delete',
  /** Customize's collection writes (rename, list, reorder) — not part of `storefrontDesign`. */
  storefrontManage: 'storefront.manage',
  /** The store's look: the Site draft/publish that Customize and Themes work on. */
  storefrontDesign: 'storefront.design',
} as const;

/**
 * Who may email a receipt or a dues statement to a customer. Mirrors the
 * backend's `SALES_DOCUMENT_EMAIL_PERMISSIONS`: sending is mail on the shop's
 * behalf, so it takes a sales WRITE permission — the counter (`sales.create`)
 * or collections (`sales.edit`) — never `sales.view` alone.
 */
export const SALES_DOCUMENT_EMAIL_PERMISSIONS = ['sales.create', 'sales.edit'] as const;

/** Whether the signed-in user's role grants the given permission. */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}

/** Whether the signed-in user may email a sales document (see `SALES_DOCUMENT_EMAIL_PERMISSIONS`). */
export function useCanEmailSalesDocuments(): boolean {
  const permissions = useAuthStore((state) => state.user?.permissions);
  return SALES_DOCUMENT_EMAIL_PERMISSIONS.some((p) => permissions?.includes(p) ?? false);
}

/**
 * Whether the user may see and act on billing — the Billing page, its entry in
 * the sidebar's user menu, and the subscription banner's "Pay now" /
 * "Reactivate" actions (which mint a real payment session, so they are gated,
 * not just hidden).
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
