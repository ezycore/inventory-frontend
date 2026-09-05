"use client";
// coding-standard: maintained
import { useGetSubscription } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * The limits the backend can actually enforce, keyed by the usage counter each
 * one caps. Mirrors `LIMIT_ALIASES` in the backend's `utils/plan-limits.ts`:
 * Mission Control may author a ceiling under either the short or the canonical
 * name, and the meter must read the same value enforcement reads.
 *
 * `storageGb` is deliberately absent — it is published on the pricing page but
 * nothing meters bytes, so there is no count to show and nothing to block at.
 */
const LIMIT_ALIASES = {
  locations: ["maxLocations", "locations"],
  users: ["maxUsers", "users"],
  inventory: ["maxInventoryProducts", "maxProducts", "inventory", "products"],
  salesToday: ["salesPerDay", "maxSalesPerDay"],
  purchasesToday: ["purchasePerDay", "maxPurchasePerDay"],
} as const;

export type PlanLimitKey = keyof typeof LIMIT_ALIASES;

export interface PlanLimit {
  /** How many the workspace has now. `undefined` until the count arrives. */
  used?: number;
  /** The ceiling, or `undefined` when the plan sets none (= unlimited). */
  limit?: number;
  /** True only when the ceiling is known AND reached. Never true while loading. */
  atLimit: boolean;
  /** Whether the ceiling is knowable at all — see below. */
  known: boolean;
}

/**
 * Where a workspace stands against one of its plan's ceilings.
 *
 * This exists because the ceilings were invisible until the moment they bit.
 * A merchant at 3 of 3 locations saw an enabled **Add Location** button, filled
 * the form in, and got a 403 on submit — with no count anywhere on the screen
 * beforehand and no route to the thing that would fix it. The backend's message
 * is good ("Your plan allows up to 3 locations. Upgrade your plan to add more.")
 * but arrives after the work, and nothing in the app handles its
 * `PLAN_LIMIT_EXCEEDED` code (QA-R11).
 *
 * **`known` is false, not `atLimit` true, when the count cannot be read.** The
 * usage endpoint needs `organization.view`, which a user holding only
 * `locations.manage` does not have. Treating a 403 there as "you are at your
 * limit" would block a merchant who has room, which is a worse failure than the
 * one being fixed — so an unreadable ceiling degrades to exactly today's
 * behaviour: no count shown, nothing disabled, the backend still enforcing.
 */
export function usePlanLimit(key: PlanLimitKey): PlanLimit {
  const canViewOrganization =
    useAuthStore((s) => s.user?.permissions)?.includes("organization.view") ??
    false;

  const { data } = useGetSubscription(canViewOrganization);

  const limits = (data?.entitlement?.limits ?? {}) as Record<string, number>;
  const used = data?.usage?.[key];

  let limit: number | undefined;
  for (const alias of LIMIT_ALIASES[key]) {
    const value = limits[alias];
    // Non-positive means unlimited, same convention as the backend.
    if (typeof value === "number" && value > 0) {
      limit = value;
      break;
    }
  }

  return {
    used,
    limit,
    known: canViewOrganization && !!data,
    atLimit:
      typeof limit === "number" && typeof used === "number" && used >= limit,
  };
}
