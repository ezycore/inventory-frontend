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
 * `storageGb` is deliberately absent from THIS map: it is the one limit whose
 * usage is not a count, so it gets `useStorageLimit` below rather than being
 * forced through a shape that would report bytes as a number of things.
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

/** Bytes in one gigabyte, matching the backend's `BYTES_PER_GB`. */
const BYTES_PER_GB = 1024 ** 3;

/**
 * Fraction of the cap at which a merchant is warned.
 *
 * Mirrors `STORAGE_WARN_RATIO` in the backend's `utils/plan-limits.ts`. A meter
 * that warns at a different fraction than the backend blocks at is a meter that
 * lies, so the two move together or not at all.
 */
export const STORAGE_WARN_RATIO = 0.8;

export interface StorageLimit {
  usedBytes?: number;
  limitBytes?: number;
  /** 0–1 against the cap; `undefined` while loading or when unlimited. */
  ratio?: number;
  /** At or past the cap — the next upload is refused. */
  atLimit: boolean;
  /** Past the warn threshold but not yet blocked: act now, not later. */
  nearLimit: boolean;
  known: boolean;
}

/**
 * Where a workspace stands against its **storage** cap.
 *
 * Separate from `usePlanLimit` because storage is the only limit measured in
 * bytes rather than things — "3 of 5 locations" and "1.6 of 2 GB" do not share
 * a shape, and flattening them would either round bytes into uselessness or
 * make every other meter carry a unit it does not have.
 *
 * `nearLimit` exists because of a product decision, not a technical one:
 * storage is the one cap a merchant cannot quickly free — at the ceiling,
 * adding a product photo means first deleting another product's photo, and the
 * refusal lands mid-workflow. So they are warned from 80% and blocked at 100%,
 * which only works if something actually shows the warning.
 *
 * Degrades exactly like `usePlanLimit`: `known: false` when the usage endpoint
 * cannot be read, never `atLimit: true`. Blocking a merchant who has room is
 * worse than the problem being solved.
 */
export function useStorageLimit(): StorageLimit {
  const canViewOrganization =
    useAuthStore((s) => s.user?.permissions)?.includes("organization.view") ??
    false;

  const { data } = useGetSubscription(canViewOrganization);

  const limits = (data?.entitlement?.limits ?? {}) as Record<string, number>;
  const usedBytes = data?.usage?.storageBytes;

  let limitGb: number | undefined;
  for (const alias of ["storageGb", "maxStorageGb"]) {
    const value = limits[alias];
    // Non-positive means unlimited, same convention as the backend.
    if (typeof value === "number" && value > 0) {
      limitGb = value;
      break;
    }
  }

  const limitBytes = limitGb === undefined ? undefined : limitGb * BYTES_PER_GB;
  const ratio =
    typeof usedBytes === "number" && typeof limitBytes === "number"
      ? usedBytes / limitBytes
      : undefined;

  // Both flags are gated on `known` rather than on `ratio` alone. Without the
  // permission the query is disabled and no data should arrive — but "should"
  // is doing too much work for a flag that blocks a merchant: a cached response
  // from a session where the permission was held would otherwise report
  // `atLimit` while `known` is false, which is the exact failure the docstring
  // promises not to have. Gating makes the promise structural.
  const known = canViewOrganization && !!data;

  return {
    usedBytes,
    limitBytes,
    ratio,
    known,
    atLimit: known && ratio !== undefined && ratio >= 1,
    nearLimit:
      known && ratio !== undefined && ratio >= STORAGE_WARN_RATIO && ratio < 1,
  };
}
