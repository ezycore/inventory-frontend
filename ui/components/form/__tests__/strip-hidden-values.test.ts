import { describe, it, expect } from "vitest";
import { stripHiddenValues, type DynamicFormConfig } from "@/ui/components/form/type";

describe("stripHiddenValues", () => {
  it("strips a field whose own dependsOn resolves to hidden", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "hasExpiry", label: "Has expiry", type: "checkbox" },
        {
          name: "expiryAlertDays",
          label: "Expiry alert",
          type: "number",
          dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
        },
      ],
    };
    const out = stripHiddenValues(config, { hasExpiry: false, expiryAlertDays: 30 });
    expect(out).toEqual({ hasExpiry: false });
  });

  it("keeps a conditionally-shown field when its condition is met", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "hasExpiry", label: "Has expiry", type: "checkbox" },
        {
          name: "expiryAlertDays",
          label: "Expiry alert",
          type: "number",
          dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
        },
      ],
    };
    const out = stripHiddenValues(config, { hasExpiry: true, expiryAlertDays: 30 });
    expect(out).toEqual({ hasExpiry: true, expiryAlertDays: 30 });
  });

  it("preserves statically hidden:true plumbing fields", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "addToInventory", label: "Track stock", type: "checkbox", hidden: true },
        { name: "name", label: "Name", type: "input" },
      ],
    };
    const out = stripHiddenValues(config, { addToInventory: true, name: "X" });
    expect(out).toEqual({ addToInventory: true, name: "X" });
  });

  it("preserves disabled-but-visible fields (action: disable)", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "productType", label: "Type", type: "select" },
        {
          name: "stock",
          label: "Stock",
          type: "input",
          dependsOn: { field: "productType", value: "variable", condition: "eq", action: "disable" },
        },
      ],
    };
    const out = stripHiddenValues(config, { productType: "variable", stock: "5" });
    expect(out).toEqual({ productType: "variable", stock: "5" });
  });

  it("strips a nested dot-path field and prunes the now-empty parent", () => {
    const config: DynamicFormConfig = {
      sections: [
        {
          title: "Basics",
          fields: [{ name: "productType", label: "Type", type: "select" }],
        },
        {
          title: "Pricing",
          fields: [
            { name: "salesTax.taxId", label: "Tax rate", type: "select" },
            { name: "salesTax.taxType", label: "Tax type", type: "select" },
          ],
          dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
        },
      ],
    };
    const out = stripHiddenValues(config, {
      productType: "variable",
      salesTax: { taxId: "t1", taxType: "inclusive" },
    });
    // Whole salesTax object removed — never sent as `{}`.
    expect(out).toEqual({ productType: "variable" });
  });

  it("keeps untouched siblings in a nested object when only one child is hidden", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "enableUOM", label: "Enable UOM", type: "checkbox" },
        { name: "unit.baseId", label: "Base unit", type: "select" },
        {
          name: "unit.purchaseId",
          label: "Purchase unit",
          type: "select",
          dependsOn: { field: "enableUOM", condition: "truthy", action: "show" },
        },
      ],
    };
    const out = stripHiddenValues(config, {
      enableUOM: false,
      unit: { baseId: "u1", purchaseId: "u2" },
    });
    expect(out).toEqual({ enableUOM: false, unit: { baseId: "u1" } });
  });

  it("does not mutate the input values", () => {
    const config: DynamicFormConfig = {
      fields: [
        { name: "hasExpiry", label: "Has expiry", type: "checkbox" },
        {
          name: "expiryAlertDays",
          label: "Expiry alert",
          type: "number",
          dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
        },
      ],
    };
    const input = { hasExpiry: false, expiryAlertDays: 30 };
    stripHiddenValues(config, input);
    expect(input).toEqual({ hasExpiry: false, expiryAlertDays: 30 });
  });
});
