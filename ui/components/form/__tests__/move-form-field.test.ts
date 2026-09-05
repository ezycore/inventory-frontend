// coding-standard: maintained

import { describe, expect, it } from "vitest";
import {
  moveFormField,
  omitFormFields,
  releaseFieldDependencies,
} from "../form-utils";

/**
 * Relocating cost price is what finally empties the Inventory section on a
 * stock-free product form.
 *
 * Field-level exclusion alone could never do it. Cost price has to survive —
 * `provisionUntrackedInventory` writes it and it is the only reason gross profit
 * is real at that tier — and one surviving field keeps the section, which keeps
 * its "Stock levels and low-stock alerts" heading and its **Track stock**
 * toggle. The toggle is a `headerAction`, not a field, so nothing that filters
 * fields can reach it (QA-N1/C2).
 */
const config = () => ({
  sections: [
    {
      id: "pricing",
      title: "Pricing",
      fields: [{ name: "price", type: "number" }],
    },
    {
      id: "inventory",
      title: "Inventory",
      description: "Stock levels and low-stock alerts",
      headerAction: () => null,
      fields: [
        { name: "addToInventory", type: "checkbox" },
        { name: "openingStock", type: "number", dependsOn: [{ field: "addToInventory" }] },
        {
          name: "costPrice",
          type: "number",
          dependsOn: [
            { field: "addToInventory", condition: "truthy" },
            { field: "productType", value: "single", condition: "eq" },
          ],
        },
      ],
    },
  ],
});

describe("moveFormField", () => {
  it("moves the field and leaves nothing behind in the old section", () => {
    const out = moveFormField(config(), "costPrice", "pricing") as any;
    expect(out.sections[0].fields.map((f: any) => f.name)).toEqual([
      "price",
      "costPrice",
    ]);
    expect(out.sections[1].fields.map((f: any) => f.name)).toEqual([
      "addToInventory",
      "openingStock",
    ]);
  });

  it("carries the field's rules across untouched", () => {
    // The move must not quietly reset `dependsOn` — the `productType === single`
    // half still has to keep cost price off combo and variable forms.
    const out = moveFormField(config(), "costPrice", "pricing") as any;
    const cost = out.sections[0].fields.find((f: any) => f.name === "costPrice");
    expect(cost.dependsOn).toEqual(
      (config().sections[1].fields[2] as { dependsOn?: unknown }).dependsOn,
    );
  });

  it("is a no-op when the field or the destination is absent", () => {
    const before = config();
    expect(moveFormField(before, "nosuchfield", "pricing")).toBe(before);
    expect(moveFormField(before, "costPrice", "nosuchsection")).toBe(before);
  });

  it("takes the section header and its Track stock toggle with it — the real case", () => {
    // The exact composition `useFilteredFormConfig` runs for a stock-free
    // product: move, then omit, then release.
    const moved = moveFormField(config(), "costPrice", "pricing");
    const trimmed = omitFormFields(moved, ["addToInventory", "openingStock"]);
    const released = releaseFieldDependencies(trimmed, ["addToInventory"]) as any;

    // One section left, and it is not the one with the stock vocabulary on it.
    expect(released.sections).toHaveLength(1);
    expect(released.sections[0].id).toBe("pricing");
    expect(
      released.sections.some((s: any) => s.headerAction || s.id === "inventory"),
    ).toBe(false);

    // Cost price survived, and no longer waits on a toggle that is gone.
    const cost = released.sections[0].fields.find(
      (f: any) => f.name === "costPrice",
    );
    expect(cost).toBeTruthy();
    const rules = Array.isArray(cost.dependsOn) ? cost.dependsOn : [];
    expect(rules.some((r: any) => r.field === "addToInventory")).toBe(false);
    // But the product-type rule is untouched.
    expect(rules.some((r: any) => r.field === "productType")).toBe(true);
  });

  it("keeps the Inventory section when stock IS tracked", () => {
    // No move, no omit: a stocked merchant still fills it in there, and the
    // backend only persists cost price behind `addToInventory`.
    const out = config();
    expect(out.sections[1].fields.map((f: any) => f.name)).toContain("costPrice");
  });
});
