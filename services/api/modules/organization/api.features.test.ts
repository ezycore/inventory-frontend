// coding-standard: maintained
/**
 * The features endpoints read the organization lean, so an organization written
 * before `purchases` / `inventoryTracking` existed answers without those keys.
 * The settings page, the setup wizard and the features cache read this response
 * directly — it must arrive resolved (missing key = ON), as the backend treats it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_ORGANIZATION_FEATURES, type OrganizationFeatures } from "@/types";

const client = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiClient: client }));

import { organizationApi } from "./api";

const legacyMap = (): OrganizationFeatures => {
  const { purchases: _p, inventoryTracking: _i, ...rest } = {
    ...DEFAULT_ORGANIZATION_FEATURES,
    sales: false,
  };
  return rest as OrganizationFeatures;
};

const response = () => ({
  success: true,
  data: {
    features: legacyMap(),
    planFeatures: legacyMap(),
    featureRequires: {},
    featureOverrides: { sales: false },
  },
});

beforeEach(() => {
  client.get.mockResolvedValue(response());
  client.put.mockResolvedValue(response());
  client.post.mockResolvedValue(response());
});

describe("organizationApi — feature responses", () => {
  it.each([
    ["getFeatures", () => organizationApi.getFeatures()],
    ["updateFeatures", () => organizationApi.updateFeatures({ tax: true })],
    [
      "applyOnboardingStep",
      () => organizationApi.applyOnboardingStep({} as Parameters<typeof organizationApi.applyOnboardingStep>[0]),
    ],
  ])("%s reads a missing purchases / inventoryTracking key as ON", async (_, call) => {
    const { data } = await call();

    expect(data?.features.purchases).toBe(true);
    expect(data?.features.inventoryTracking).toBe(true);
    // The plan ceiling too — or Customize workspace says "not in your plan".
    expect(data?.planFeatures.purchases).toBe(true);
    expect(data?.planFeatures.inventoryTracking).toBe(true);
    expect(data?.features.sales).toBe(false);
    // The sparse overrides map is the merchant's intent, not a resolved map.
    expect(data?.featureOverrides).toEqual({ sales: false });
  });
});
