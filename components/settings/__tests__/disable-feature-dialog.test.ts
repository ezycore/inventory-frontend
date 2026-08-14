import { describe, expect, it } from "vitest";
import { disableConsequence } from "../disable-feature-dialog";
import type { FeatureImpact } from "@/services/api/modules/organization/api";

/**
 * Which disables are worth stopping a merchant for.
 *
 * A confirm on every switch trains people to click through the one that
 * matters, so the rule is: warn where there is something concrete at stake, and
 * stay out of the way otherwise.
 */

/** Stands in for next-intl's translator: echoes the key and its count. */
const t = ((key: string, values?: Record<string, unknown>) =>
  values && "count" in values ? `${key}:${values.count}` : key) as never;

const impact = (over: Partial<FeatureImpact> = {}): FeatureImpact => ({
  storefront: { pendingOnlineOrders: 0 },
  expiryTracking: { trackedBatches: 0 },
  multiLocation: { locations: 1 },
  returns: { salesReturns: 0, purchaseReturns: 0 },
  ...over,
});

describe("disableConsequence — storefront", () => {
  it("always warns, even with nothing in the queue", () => {
    // The shop going offline is the consequence; pending orders only sharpen
    // it. A silent disable here takes a public website down without a word.
    expect(disableConsequence("storefront", impact(), t)).toBe(
      "disable.storefront:0",
    );
  });

  it("carries the pending order count", () => {
    const result = disableConsequence(
      "storefront",
      impact({ storefront: { pendingOnlineOrders: 3 } }),
      t,
    );

    expect(result).toBe("disable.storefront:3");
  });
});

describe("disableConsequence — count-dependent features", () => {
  it("stays silent when there is no data to hide", () => {
    expect(disableConsequence("expiryTracking", impact(), t)).toBeNull();
    expect(disableConsequence("returns", impact(), t)).toBeNull();
  });

  it("warns once batches are tracked", () => {
    const result = disableConsequence(
      "expiryTracking",
      impact({ expiryTracking: { trackedBatches: 12 } }),
      t,
    );

    expect(result).toBe("disable.expiryTracking:12");
  });

  it("warns once returns exist", () => {
    const result = disableConsequence(
      "returns",
      impact({ returns: { salesReturns: 2, purchaseReturns: 0 } }),
      t,
    );

    expect(result).toBe("disable.returns:2");
  });

  it("warns a merchant whose returns are all supplier-side", () => {
    // The `returns` feature gates the purchase-return routes too. Counting only
    // sales returns told a shop with 200 supplier returns and no customer
    // returns that nothing would change — the confirm dialog's one job is to
    // say what is about to disappear.
    const result = disableConsequence(
      "returns",
      impact({ returns: { salesReturns: 0, purchaseReturns: 200 } }),
      t,
    );

    expect(result).toBe("disable.returns:200");
  });

  it("counts both kinds together", () => {
    const result = disableConsequence(
      "returns",
      impact({ returns: { salesReturns: 3, purchaseReturns: 4 } }),
      t,
    );

    expect(result).toBe("disable.returns:7");
  });
});

describe("disableConsequence — multiLocation", () => {
  it("stays silent for a single-location org, which loses nothing", () => {
    expect(
      disableConsequence("multiLocation", impact({ multiLocation: { locations: 1 } }), t),
    ).toBeNull();
  });

  it("warns once a second location exists", () => {
    const result = disableConsequence(
      "multiLocation",
      impact({ multiLocation: { locations: 3 } }),
      t,
    );

    expect(result).toBe("disable.multiLocation:3");
  });
});

describe("disableConsequence — everything else", () => {
  it("does not interrupt low-stakes toggles", () => {
    for (const feature of ["barcodeSystem", "combo", "uomConversion", "tax"] as const) {
      expect(disableConsequence(feature, impact(), t)).toBeNull();
    }
  });

  it("stays silent while the counts are still loading", () => {
    expect(disableConsequence("storefront", undefined, t)).toBeNull();
  });
});
