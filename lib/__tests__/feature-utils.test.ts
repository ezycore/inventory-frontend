// coding-standard: maintained
/**
 * The frontend reads a feature exactly as the backend does: OFF only on an
 * explicit `false`, so a key MISSING from the organization's stored map is ON.
 *
 * The regression: `purchases` and `inventoryTracking` were added after most
 * organizations were written, the API reads the organization lean, and the maps
 * arrive without those keys. The backend hydrates them as ON (`default: true` on
 * every schema key) and `requireFeature` blocks only `false` — so the API served
 * Purchases and Stock while this side's `=== true` hid both sidebar groups and
 * Customize workspace called them "not included in your plan".
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_ORGANIZATION_FEATURES, type OrganizationFeatures } from "@/types";
import {
  areAllFeaturesEnabled,
  getEnabledFeatures,
  isAnyFeatureEnabled,
  isFeatureEnabled,
  isFeatureOn,
  resolveFeatureMap,
} from "../feature-utils";

/** A map as a pre-tier organization stores it: no `purchases`, no `inventoryTracking`. */
const legacyMap = (): OrganizationFeatures => {
  const { purchases: _p, inventoryTracking: _i, ...rest } = {
    ...DEFAULT_ORGANIZATION_FEATURES,
    sales: false,
    tax: false,
  };
  return rest as OrganizationFeatures;
};

describe("resolveFeatureMap", () => {
  it("fills a missing purchases / inventoryTracking key as ON", () => {
    const resolved = resolveFeatureMap(legacyMap());
    expect(resolved?.purchases).toBe(true);
    expect(resolved?.inventoryTracking).toBe(true);
  });

  it("keeps an explicit false as OFF", () => {
    const resolved = resolveFeatureMap({ ...legacyMap(), purchases: false });
    expect(resolved?.purchases).toBe(false);
    expect(resolved?.sales).toBe(false);
    expect(resolved?.tax).toBe(false);
  });

  it("returns every known key", () => {
    const resolved = resolveFeatureMap({ storefront: false });
    expect(Object.keys(resolved ?? {}).sort()).toEqual(
      Object.keys(DEFAULT_ORGANIZATION_FEATURES).sort(),
    );
    expect(resolved?.storefront).toBe(false);
  });

  it("leaves a map that has not loaded as no map", () => {
    expect(resolveFeatureMap(undefined)).toBeUndefined();
    expect(resolveFeatureMap(null)).toBeUndefined();
  });
});

describe("feature helpers read a missing key as ON", () => {
  it("isFeatureOn / isFeatureEnabled", () => {
    expect(isFeatureOn(legacyMap(), "purchases")).toBe(true);
    expect(isFeatureEnabled(legacyMap(), "inventoryTracking")).toBe(true);
    expect(isFeatureEnabled(legacyMap(), "sales")).toBe(false);
  });

  it("areAllFeaturesEnabled / isAnyFeatureEnabled", () => {
    expect(areAllFeaturesEnabled(legacyMap(), ["purchases", "inventoryTracking"])).toBe(true);
    expect(areAllFeaturesEnabled(legacyMap(), ["purchases", "sales"])).toBe(false);
    expect(isAnyFeatureEnabled(legacyMap(), ["sales", "purchases"])).toBe(true);
  });

  it("getEnabledFeatures lists the missing keys as enabled", () => {
    expect(getEnabledFeatures(legacyMap())).toEqual(
      expect.arrayContaining(["purchases", "inventoryTracking"]),
    );
  });

  it("still answers OFF before the map has loaded", () => {
    expect(isFeatureEnabled(undefined, "purchases")).toBe(false);
    expect(areAllFeaturesEnabled(undefined, ["purchases"])).toBe(false);
  });
});
