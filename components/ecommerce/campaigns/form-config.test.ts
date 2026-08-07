import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_SCOPE_LABEL,
  CAMPAIGN_TARGET_FIELD,
  campaignDefaultValues,
  campaignFormConfig,
} from "@/components/ecommerce/campaigns/form-config";

/**
 * The scope surface has to stay in lockstep with the backend engine
 * (`campaign.service.buildPricer`). It did not: the form offered three of the
 * five scopes, so `subcategory` and `tag` campaigns were implemented, priced
 * and unbuildable. These pin every place the mapping is consumed.
 */
const ENGINE_SCOPES = [
  "storewide",
  "category",
  "subcategory",
  "product",
  "tag",
] as const;

const fieldNames = campaignFormConfig.fields.map((f) => f.name);

/**
 * The params as the SERVER sees them. Asserting on the raw URL would be testing
 * `URLSearchParams` encoding (`!` → `%21`) rather than the contract; Express
 * percent-decodes before the service reads `req.query`.
 */
const paramsOf = (url: string | undefined) =>
  Object.fromEntries(new URLSearchParams(url?.split("?")[1] ?? ""));
const scopeField = campaignFormConfig.fields.find((f) => f.name === "scope");

describe("campaign scopes", () => {
  it("offers exactly the scopes the pricing engine implements", () => {
    const offered = (scopeField?.options ?? []).map((o) => o.value);
    expect(offered.sort()).toEqual([...ENGINE_SCOPES].sort());
  });

  it("gives every targeting scope a field, a default and a label", () => {
    for (const scope of ENGINE_SCOPES) {
      expect(CAMPAIGN_SCOPE_LABEL[scope]).toBeTruthy();
      if (scope === "storewide") continue; // targets nothing, by definition

      const field = CAMPAIGN_TARGET_FIELD[scope];
      expect(field, `${scope} has no target field`).toBeTruthy();
      expect(fieldNames, `${field} missing from the form`).toContain(field);
      expect(
        campaignDefaultValues,
        `${field} missing from defaults`,
      ).toHaveProperty(field);
    }
  });

  it("shows each target field only under its own scope", () => {
    for (const [scope, field] of Object.entries(CAMPAIGN_TARGET_FIELD)) {
      const config = campaignFormConfig.fields.find((f) => f.name === field);
      expect((config?.dependsOn as { value?: string })?.value).toBe(scope);
    }
  });

  it("pins the category picker to TOP-LEVEL categories", () => {
    // A `category` campaign matches `product.categoryId`, which always holds
    // the parent — offering a child here builds a campaign that silently never
    // discounts anything. That is the whole bug this file exists for.
    const config = campaignFormConfig.fields.find(
      (f) => f.name === CAMPAIGN_TARGET_FIELD.category,
    );
    expect(paramsOf(config?.optionsApi).parentId).toBe("null");
  });

  it("offers only sub-categories under the sub-category scope", () => {
    const config = campaignFormConfig.fields.find(
      (f) => f.name === CAMPAIGN_TARGET_FIELD.subcategory,
    );
    expect(paramsOf(config?.optionsApi).parentId).toBe("!null");
  });

  it("labels a sub-category option by its parent, not its bare name", () => {
    // Child names are unique only within a parent, so two "Accessories" rows
    // would be indistinguishable on a pricing screen.
    const config = campaignFormConfig.fields.find(
      (f) => f.name === CAMPAIGN_TARGET_FIELD.subcategory,
    );
    const options = config?.itemsCreateCallback?.({
      data: {
        items: [
          { _id: "c1", name: "Accessories", parent: { name: "Phones" } },
          { _id: "c2", name: "Accessories", parent: { name: "Laptops" } },
          { _id: "c3", name: "Orphan" },
        ],
      },
    });

    expect(options?.map((o) => o.label)).toEqual([
      "Phones › Accessories",
      "Laptops › Accessories",
      "Orphan",
    ]);
    expect(options?.map((o) => o.value)).toEqual(["c1", "c2", "c3"]);
  });
});
