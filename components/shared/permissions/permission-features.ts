// coding-standard: maintained
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { FeatureName, OrganizationFeatures } from "@/types";

/**
 * Which features a permission needs before a permission list shows it.
 *
 * **Mirrors the backend** `MODULE_FEATURES` / `PERMISSION_FEATURES` in
 * `inventory-backend/src/utils/permission-catalog.ts` — change both together.
 * The role builder does not use this: it renders the backend catalog, which is
 * already filtered. This is for the read-only lists that have no catalog to
 * hand (role details, the roles table's count, profile → Permissions), so all
 * of them hide the same modules the builder does.
 *
 * Hiding is display only. A role keeps every permission it holds, and the
 * routes stay feature-gated either way.
 */
interface FeatureRule {
  all?: FeatureName[];
  any?: FeatureName[];
}

const MODULE_FEATURES: Record<string, FeatureRule> = {
  accounts: { all: ["accounts"] },
  transactions: { all: ["accounts"] },
  taxes: { all: ["tax"] },
  returns: { all: ["returns"], any: ["sales", "storefront", "purchases"] },
  storefront: { all: ["storefront"] },
  purchases: { all: ["purchases"] },
  suppliers: { all: ["purchases"] },
  stock: { all: ["inventoryTracking"] },
  discounts: { any: ["sales", "purchases"] },
};

const PERMISSION_FEATURES: Record<string, FeatureRule> = {
  "sales.create": { all: ["sales"] },
};

/**
 * Off only on an explicit `false`, as the backend gate reads it — and with no
 * feature map loaded yet, nothing is hidden rather than everything.
 */
const isOn = (features: OrganizationFeatures | undefined, key: FeatureName) =>
  features?.[key] !== false;

const ruleHolds = (rule: FeatureRule | undefined, features?: OrganizationFeatures) =>
  !rule ||
  ((rule.all ?? []).every((key) => isOn(features, key)) &&
    (!rule.any?.length || rule.any.some((key) => isOn(features, key))));

export function isPermissionVisible(
  permission: string,
  features: OrganizationFeatures | undefined,
): boolean {
  const [module] = permission.split(".");
  return (
    ruleHolds(MODULE_FEATURES[module], features) &&
    ruleHolds(PERMISSION_FEATURES[permission], features)
  );
}

export function visiblePermissions(
  permissions: string[],
  features: OrganizationFeatures | undefined,
): string[] {
  return permissions.filter((permission) => isPermissionVisible(permission, features));
}

/** `permissions` without the ones this workspace has switched off. */
export function useVisiblePermissions(permissions: string[]): string[] {
  const features = useAuthStore((state) => state.user?.organization?.features);
  return visiblePermissions(permissions, features);
}
