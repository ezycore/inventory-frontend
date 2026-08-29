import { describe, expect, it } from "vitest";
import { scopeDefaults } from "@/hooks/use-quick-add-module";
import { selectOptions } from "@/services/api/select-options";
import type { DynamicFormConfig } from "@/ui/components/form/type";

/**
 * A creatable select whose options are narrowed by a parent must open its
 * quick-add form already filed under that parent. The regression this guards:
 * the product form's Sub-category quick-add defaulted `parentId` to empty, so
 * it created a TOP-LEVEL category that then did not appear in the dropdown it
 * was created from — the new row appeared to vanish.
 */
const categoryForm = {
  fields: [
    { name: "parentId", type: "select", label: "Parent category" },
    { name: "name", type: "input", label: "Name" },
    { name: "defaultTaxId", type: "select", label: "Default VAT rate" },
  ],
} as unknown as DynamicFormConfig;

describe("scopeDefaults", () => {
  it("seeds the parent a dependent select is already filtered by", () => {
    const url = selectOptions("categories", {
      parentId: "skin-care",
      fields: "_id,name,defaultTaxId",
    });

    expect(scopeDefaults(url, categoryForm)).toEqual({ parentId: "skin-care" });
  });

  it("ignores params that are projection or paging, not scope", () => {
    // `all` and `fields` are always present on an options URL and name no form
    // field; seeding them would put junk in the quick-add form.
    const url = selectOptions("categories", { fields: "_id,name" });
    expect(scopeDefaults(url, categoryForm)).toEqual({});
  });

  it("ignores a param the quick-add form has no field for", () => {
    const url = selectOptions("tags", { status: "active", fields: "_id,name" });
    expect(scopeDefaults(url, categoryForm)).toEqual({});
  });

  it("seeds nothing while the dependency is unresolved", () => {
    // The un-substituted template — the select has no parent chosen yet, so
    // there is no scope to inherit and certainly no literal to seed.
    const url = selectOptions("categories", {
      parentId: "{{value}}",
      fields: "_id,name",
    });

    expect(url).toContain("{{value}}");
    expect(scopeDefaults(url, categoryForm)).toEqual({});
  });

  it("seeds nothing from a filter sentinel", () => {
    // The product form's Category select asks for TOP-LEVEL categories with
    // `parentId=null`. That is a filter, not a scope: seeding it put a literal
    // "null" into the quick-add form's Parent category select, which then
    // rendered the word `null` where the placeholder belongs.
    const url = selectOptions("categories", {
      parentId: "null",
      fields: "_id,name,isDefault,defaultTaxId",
    });

    expect(url).toContain("parentId=null");
    expect(scopeDefaults(url, categoryForm)).toEqual({});
  });

  it("seeds nothing for a select with no query string at all", () => {
    expect(scopeDefaults(undefined, categoryForm)).toEqual({});
    expect(scopeDefaults("/categories", categoryForm)).toEqual({});
  });
});
