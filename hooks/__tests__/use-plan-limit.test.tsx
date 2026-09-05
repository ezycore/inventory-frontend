// coding-standard: maintained

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Where a workspace stands against a plan ceiling.
 *
 * The ceilings were invisible until they bit: at 3 of 3 locations the Add
 * button stayed enabled, no count appeared anywhere, and the merchant learnt
 * their limit from a 403 after filling in the form — with nothing on screen
 * linking to the upgrade that would fix it (QA-R11).
 *
 * The case that matters most here is the one that must NOT block: the usage
 * endpoint needs `organization.view`, and a user holding only `locations.manage`
 * cannot read it. Reading an unknown count as "at your limit" would block a
 * merchant who has room — worse than the bug being fixed.
 */

const store = { user: null as { permissions?: string[] } | null };

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
}));

const subscription = {
  data: undefined as unknown,
  enabled: true,
};

vi.mock("@/services/api", () => ({
  useGetSubscription: (enabled: boolean) => {
    subscription.enabled = enabled;
    return { data: enabled ? subscription.data : undefined };
  },
}));

import { usePlanLimit } from "../use-plan-limit";

const withPlan = (
  limits: Record<string, number>,
  usage: Record<string, number>,
) => {
  store.user = { permissions: ["organization.view"] };
  subscription.data = { entitlement: { limits }, usage };
};

beforeEach(() => {
  store.user = null;
  subscription.data = undefined;
  subscription.enabled = true;
});

describe("usePlanLimit", () => {
  it("reports room left below the ceiling", () => {
    withPlan({ maxLocations: 3 }, { locations: 2 });

    const { result } = renderHook(() => usePlanLimit("locations"));

    expect(result.current).toMatchObject({
      used: 2,
      limit: 3,
      atLimit: false,
      known: true,
    });
  });

  it("reports the ceiling reached at exactly the limit", () => {
    withPlan({ maxLocations: 3 }, { locations: 3 });

    expect(renderHook(() => usePlanLimit("locations")).result.current.atLimit)
      .toBe(true);
  });

  it("does not claim a limit when the count cannot be read", () => {
    // No `organization.view`: the query is never enabled, so nothing is known
    // and nothing may be blocked.
    store.user = { permissions: ["locations.manage"] };

    const { result } = renderHook(() => usePlanLimit("locations"));

    expect(subscription.enabled).toBe(false);
    expect(result.current.atLimit).toBe(false);
    expect(result.current.known).toBe(false);
    expect(result.current.limit).toBeUndefined();
  });

  it("does not claim a limit while the answer is still loading", () => {
    store.user = { permissions: ["organization.view"] };
    subscription.data = undefined;

    const { result } = renderHook(() => usePlanLimit("locations"));

    expect(result.current.atLimit).toBe(false);
    expect(result.current.known).toBe(false);
  });

  it("treats an absent ceiling as unlimited", () => {
    withPlan({}, { locations: 99 });

    const { result } = renderHook(() => usePlanLimit("locations"));

    expect(result.current.limit).toBeUndefined();
    expect(result.current.atLimit).toBe(false);
  });

  it("treats a non-positive ceiling as unlimited, like the backend", () => {
    withPlan({ maxLocations: 0 }, { locations: 5 });

    expect(renderHook(() => usePlanLimit("locations")).result.current.atLimit)
      .toBe(false);
  });

  it("reads a ceiling stored under either alias", () => {
    // Mission Control may author `maxUsers` or plain `users`; enforcement
    // accepts both, so the meter must too.
    withPlan({ users: 8 }, { users: 8 });

    expect(renderHook(() => usePlanLimit("users")).result.current).toMatchObject(
      { limit: 8, atLimit: true },
    );
  });

  it("prefers the canonical alias when both are present", () => {
    withPlan({ maxInventoryProducts: 10000, products: 50 }, { inventory: 60 });

    const { result } = renderHook(() => usePlanLimit("inventory"));

    expect(result.current.limit).toBe(10000);
    expect(result.current.atLimit).toBe(false);
  });
});
