// coding-standard: maintained
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * The storage meter — the frontend half of Phase 4 in the backend's
 * `docs/plan/storage-metering.md`.
 *
 * It is load-bearing rather than decorative because of a product decision:
 * storage is the one cap a merchant cannot quickly free, so they are **warned
 * from 80%** and blocked at 100%. A warning nobody renders is the same as no
 * warning, and then the block is exactly the ambush the decision exists to
 * avoid.
 *
 * The failure mode to guard is the one `usePlanLimit` documents: when usage
 * cannot be read, degrade to `known: false` — **never** to `atLimit: true`.
 * Blocking a merchant who has room is worse than the problem being fixed.
 */
const subscription = vi.hoisted(() => ({ data: undefined as unknown }));
const permissions = vi.hoisted(() => ({ value: ["organization.view"] as string[] }));

vi.mock("@/services/api", () => ({
  useGetSubscription: () => ({ data: subscription.data }),
}));

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { permissions: permissions.value } }),
}));

const { useStorageLimit, STORAGE_WARN_RATIO } = await import(
  "@/hooks/use-plan-limit"
);

const GB = 1024 ** 3;

const withUsage = (storageBytes: number, storageGb?: number) => {
  subscription.data = {
    entitlement: { limits: storageGb === undefined ? {} : { storageGb } },
    usage: { storageBytes },
  };
};

describe("useStorageLimit", () => {
  beforeEach(() => {
    subscription.data = undefined;
    permissions.value = ["organization.view"];
  });

  const read = () => renderHook(() => useStorageLimit()).result.current;

  it("reports the ratio against the plan's ceiling", () => {
    withUsage(1 * GB, 2);

    const limit = read();
    expect(limit.ratio).toBe(0.5);
    expect(limit.atLimit).toBe(false);
    expect(limit.nearLimit).toBe(false);
  });

  it("warns from the same fraction the backend blocks toward", () => {
    // 80% is shared with `STORAGE_WARN_RATIO` in the backend's plan-limits.
    // A meter that warns at a different fraction than enforcement uses is a
    // meter that lies.
    withUsage(STORAGE_WARN_RATIO * 2 * GB, 2);

    const limit = read();
    expect(limit.nearLimit).toBe(true);
    expect(limit.atLimit).toBe(false);
  });

  it("stops warning once it is blocking", () => {
    // The two states are exclusive: a merchant who is already refused should be
    // told they are refused, not that they are approaching a cap.
    withUsage(2 * GB, 2);

    const limit = read();
    expect(limit.atLimit).toBe(true);
    expect(limit.nearLimit).toBe(false);
  });

  it("treats a non-positive ceiling as unlimited", () => {
    withUsage(500 * GB, 0);

    const limit = read();
    expect(limit.limitBytes).toBeUndefined();
    expect(limit.atLimit).toBe(false);
  });

  it("is not at the limit when the plan sets no storage ceiling", () => {
    withUsage(500 * GB);

    expect(read().atLimit).toBe(false);
  });

  describe("when usage cannot be read", () => {
    it("reports unknown rather than at-limit without the permission", () => {
      // The usage endpoint needs `organization.view`. A user who lacks it must
      // see today's behaviour — no meter — not a false block.
      permissions.value = [];
      withUsage(2 * GB, 2);

      const limit = read();
      expect(limit.known).toBe(false);
      expect(limit.atLimit).toBe(false);
    });

    it("reports unknown while the request is still in flight", () => {
      subscription.data = undefined;

      const limit = read();
      expect(limit.known).toBe(false);
      expect(limit.atLimit).toBe(false);
      expect(limit.nearLimit).toBe(false);
    });
  });
});
