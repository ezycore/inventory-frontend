// coding-standard: maintained
/**
 * Every way a feature map reaches the auth store resolves it by the backend's
 * rule — a missing key is ON — because the ~50 screens reading
 * `user.organization.features` directly do not resolve it themselves.
 *
 * Three doors, one test each: login / `/auth/me` (`setUser`), a toggle or wizard
 * step (`updateFeatures`), and a reload of a session persisted before this rule
 * existed (rehydration). Missing any one of them brings the hidden Purchases and
 * Stock groups back for exactly the merchants the fix is for.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_ORGANIZATION_FEATURES, type OrganizationFeatures } from "@/types";
import { useAuthStore, type User } from "../use-auth-store";

const legacyMap = (): OrganizationFeatures => {
  const { purchases: _p, inventoryTracking: _i, ...rest } = {
    ...DEFAULT_ORGANIZATION_FEATURES,
    tax: false,
  };
  return rest as OrganizationFeatures;
};

const legacyUser = (): User =>
  ({
    id: "u1",
    email: "owner@example.test",
    role: "admin",
    permissions: [],
    organization: {
      name: "Legacy",
      slug: "legacy",
      features: legacyMap(),
      planFeatures: legacyMap(),
    },
  }) as unknown as User;

const org = () => useAuthStore.getState().user?.organization;

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().clearAuth();
});

describe("auth store — feature maps enter resolved", () => {
  it("setUser reads a missing purchases / inventoryTracking key as ON, in both maps", () => {
    useAuthStore.getState().setUser(legacyUser(), "token");

    expect(org()?.features?.purchases).toBe(true);
    expect(org()?.features?.inventoryTracking).toBe(true);
    expect(org()?.planFeatures?.purchases).toBe(true);
    expect(org()?.planFeatures?.inventoryTracking).toBe(true);
    // An explicit false is still off.
    expect(org()?.features?.tax).toBe(false);
  });

  it("updateFeatures resolves what a toggle or wizard step returns", () => {
    useAuthStore.getState().setUser(legacyUser(), "token");
    useAuthStore
      .getState()
      .updateFeatures({ ...legacyMap(), storefront: false }, legacyMap());

    expect(org()?.features?.purchases).toBe(true);
    expect(org()?.features?.storefront).toBe(false);
    expect(org()?.planFeatures?.inventoryTracking).toBe(true);
  });

  it("resolves a session persisted before the rule, on rehydration", async () => {
    localStorage.setItem(
      "easystock-auth",
      JSON.stringify({
        state: { user: legacyUser(), token: "token", isAuthenticated: true },
        version: 0,
      }),
    );

    await useAuthStore.persist.rehydrate();

    expect(org()?.features?.purchases).toBe(true);
    expect(org()?.features?.inventoryTracking).toBe(true);
    expect(org()?.features?.tax).toBe(false);
  });
});
