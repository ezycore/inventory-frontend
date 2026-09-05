// coding-standard: maintained
/**
 * A field must be able to outlive the trigger it depends on.
 *
 * The case this exists for: a stock-free product form drops the "Add to
 * inventory" toggle along with the rest of the Inventory section, but must KEEP
 * Cost price. `costPrice` lives on the Inventory model and nowhere else, and it
 * is the only reason gross profit is real at that tier rather than a permanent
 * 100% margin. It renders only when `addToInventory` is truthy — so omitting the
 * toggle alone takes cost price with it, and does so silently: no error, no
 * warning, just a form with no place to enter what the merchant paid.
 */
import { describe, it, expect } from "vitest";
import {
  omitFormFields,
  releaseFieldDependencies,
} from "../form-utils";

const config = () => ({
  sections: [
    {
      title: "Inventory",
      fields: [
        { name: "addToInventory", type: "checkbox" },
        {
          name: "costPrice",
          type: "number",
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
          ],
        },
        {
          name: "openingStock",
          type: "number",
          dependsOn: { field: "addToInventory", condition: "truthy" },
        },
      ],
    },
  ],
});

describe("releaseFieldDependencies", () => {
  it("drops only the rules naming the removed trigger", () => {
    const out = releaseFieldDependencies(config(), ["addToInventory"]);
    const cost = out.sections[0].fields.find((f: any) => f.name === "costPrice");
    // The product-type rule is untouched: cost price is still single-only.
    expect(cost.dependsOn).toEqual([
      { field: "productType", value: "single", condition: "eq" },
    ]);
  });

  it("removes `dependsOn` entirely when nothing is left of it", () => {
    const out = releaseFieldDependencies(config(), ["addToInventory"]);
    const opening = out.sections[0].fields.find(
      (f: any) => f.name === "openingStock",
    );
    // An empty rule array is not the same as no rules — some renderers treat
    // `dependsOn: []` as "conditions unmet". The key has to go.
    expect("dependsOn" in opening).toBe(false);
  });

  it("leaves a config alone when the trigger is not named", () => {
    const before = config();
    expect(releaseFieldDependencies(before, ["somethingElse"])).toEqual(before);
    expect(releaseFieldDependencies(before, [])).toBe(before);
  });

  it("keeps cost price reachable after the toggle is stripped — the real case", () => {
    // The exact composition `useFilteredFormConfig` performs for a stock-free
    // product form: omit the six, then release the one that must survive.
    const trimmed = omitFormFields(config(), [
      "addToInventory",
      "openingStock",
    ]);
    const released = releaseFieldDependencies(trimmed, ["addToInventory"]);

    const names = released.sections[0].fields.map((f: any) => f.name);
    expect(names).toEqual(["costPrice"]);

    const cost = released.sections[0].fields[0];
    // Nothing left pointing at a field that is no longer in the form. Were this
    // rule still here, the merchant would see an Inventory section containing
    // exactly one field that never renders.
    const rules = cost.dependsOn as any;
    expect(
      (Array.isArray(rules) ? rules : rules ? [rules] : []).some(
        (r: any) => r.field === "addToInventory",
      ),
    ).toBe(false);
  });
});
