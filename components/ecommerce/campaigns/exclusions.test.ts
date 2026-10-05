import { describe, expect, it } from "vitest";
import {
  campaignExclusionsBody,
  campaignExclusionsForm,
} from "@/components/ecommerce/campaigns/exclusions";
import {
  CAMPAIGN_EXCLUDE_FIELD,
  campaignDefaultValues,
  campaignFormConfig,
} from "@/components/ecommerce/campaigns/form-config";

const EMPTY = { categoryIds: [], subcategoryIds: [], tagIds: [], productIds: [] };

/**
 * Exclusions withhold a discount, so the failure that matters is a value the
 * merchant can no longer SEE still being sent: a picker hidden by the switch
 * or by a `product` scope must save as empty, never as what it last held.
 */
describe("campaign exclusions", () => {
  const picked = {
    excludeCategories: ["c1"],
    excludeSubcategories: ["s1"],
    excludeTags: ["t1", ""],
    excludeProducts: ["p1"],
  };

  it("sends every list when the switch is on", () => {
    expect(
      campaignExclusionsBody({ scope: "storewide", excludeEnabled: true, ...picked }),
    ).toEqual({
      categoryIds: ["c1"],
      subcategoryIds: ["s1"],
      tagIds: ["t1"],
      productIds: ["p1"],
    });
  });

  it("clears everything when the switch is off — the hidden pickers still hold ids", () => {
    expect(
      campaignExclusionsBody({ scope: "storewide", excludeEnabled: false, ...picked }),
    ).toEqual(EMPTY);
  });

  it("clears everything under a product scope, which takes no exclusions", () => {
    expect(
      campaignExclusionsBody({ scope: "product", excludeEnabled: true, ...picked }),
    ).toEqual(EMPTY);
  });

  it("opens the switch on edit exactly when something is excluded", () => {
    expect(campaignExclusionsForm({ exclude: { ...EMPTY, tagIds: ["t1"] } })).toMatchObject({
      excludeEnabled: true,
      excludeTags: ["t1"],
      excludeCategories: [],
    });
    expect(campaignExclusionsForm({ exclude: null }).excludeEnabled).toBe(false);
    expect(campaignExclusionsForm({}).excludeEnabled).toBe(false);
  });

  it("round-trips: row → form → body", () => {
    const exclude = { categoryIds: ["c1"], subcategoryIds: [], tagIds: ["t1"], productIds: [] };
    const form = campaignExclusionsForm({ exclude });
    expect(campaignExclusionsBody({ scope: "tag", ...form })).toEqual(exclude);
  });

  it("every exclusion field is in the form, the defaults, and behind the switch", () => {
    for (const field of Object.values(CAMPAIGN_EXCLUDE_FIELD)) {
      const config = campaignFormConfig.fields.find((f) => f.name === field);
      expect(config, `${field} missing from the form`).toBeTruthy();
      expect(campaignDefaultValues).toHaveProperty(field);
      const deps = config?.dependsOn as { field: string }[];
      // Scope first: only the primary condition gets select-option enrichment.
      expect(deps.map((d) => d.field)).toEqual(["scope", "excludeEnabled"]);
    }
  });

  it("offers only TOP-LEVEL categories to exclude, like the category scope", () => {
    const config = campaignFormConfig.fields.find(
      (f) => f.name === CAMPAIGN_EXCLUDE_FIELD.categoryIds,
    );
    const params = new URLSearchParams(config?.optionsApi?.split("?")[1] ?? "");
    expect(params.get("parentId")).toBe("null");
  });
});
