// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { matchesTaxonomy, NO_TAXONOMY_FILTER, taxonomyChoices, type TaxonomyFields } from "./taxonomy-filter";

const row = (over: Partial<TaxonomyFields>): TaxonomyFields => ({
  categoryId: null,
  categoryName: null,
  subcategoryId: null,
  subcategoryName: null,
  tagIds: [],
  ...over,
});

const rows = [
  row({ categoryId: "home", categoryName: "Home", subcategoryId: "cush", subcategoryName: "Cushions", tagIds: ["eid"] }),
  row({ categoryId: "home", categoryName: "Home", subcategoryId: "mats", subcategoryName: "Mats" }),
  row({ categoryId: "toys", categoryName: "Toys", tagIds: ["eid", "new"] }),
  row({}),
];

describe("taxonomy filter", () => {
  it("offers only what the rows carry, sub-categories under their own parent", () => {
    const choices = taxonomyChoices(rows);
    expect(choices.categories).toEqual([
      { id: "home", name: "Home" },
      { id: "toys", name: "Toys" },
    ]);
    expect(choices.subcategoriesOf("home").map((c) => c.name)).toEqual(["Cushions", "Mats"]);
    expect(choices.subcategoriesOf("toys")).toEqual([]);
    expect(choices.subcategoriesOf(null)).toEqual([]);
    expect([...choices.tagIds].sort()).toEqual(["eid", "new"]);
  });

  it("matches category, sub-category and tag together", () => {
    const count = (over: Partial<typeof NO_TAXONOMY_FILTER>) =>
      rows.filter((r) => matchesTaxonomy(r, { ...NO_TAXONOMY_FILTER, ...over })).length;
    expect(count({})).toBe(4);
    expect(count({ categoryId: "home" })).toBe(2);
    expect(count({ categoryId: "home", subcategoryId: "cush" })).toBe(1);
    expect(count({ tagId: "eid" })).toBe(2);
    expect(count({ categoryId: "home", tagId: "new" })).toBe(0);
  });

  it("survives rows from an older backend with no tags or sub-category", () => {
    const old = [{ categoryId: "home", categoryName: "Home" }] as unknown as TaxonomyFields[];
    expect(taxonomyChoices(old).categories).toEqual([{ id: "home", name: "Home" }]);
    expect(matchesTaxonomy(old[0], { ...NO_TAXONOMY_FILTER, tagId: "eid" })).toBe(false);
  });
});
