// coding-standard: maintained

/**
 * Category / sub-category / tag filtering for the one-page product screens — Cost prices and
 * Sold counts. Both rows carry the same five fields from the backend (`taxonomyRow`), so the two
 * screens filter identically from this one place.
 */
export interface TaxonomyFields {
  /** The TOP-LEVEL category. */
  categoryId: string | null;
  categoryName: string | null;
  /** Its child, when the product sits in one. */
  subcategoryId: string | null;
  subcategoryName: string | null;
  tagIds: string[];
}

export interface TaxonomyFilter {
  categoryId: string | null;
  subcategoryId: string | null;
  tagId: string | null;
}

export const NO_TAXONOMY_FILTER: TaxonomyFilter = { categoryId: null, subcategoryId: null, tagId: null };

export const matchesTaxonomy = (row: TaxonomyFields, filter: TaxonomyFilter): boolean =>
  (!filter.categoryId || row.categoryId === filter.categoryId) &&
  (!filter.subcategoryId || row.subcategoryId === filter.subcategoryId) &&
  (!filter.tagId || (row.tagIds ?? []).includes(filter.tagId));

export interface TaxonomyChoice {
  id: string;
  name: string;
}

const byName = (a: TaxonomyChoice, b: TaxonomyChoice) => a.name.localeCompare(b.name);

/**
 * What the filters can offer, read off the rows themselves — so a choice never leads to an empty
 * list. Sub-categories are grouped under their parent: the sub-category filter lists only the
 * children of the category picked.
 */
export function taxonomyChoices(rows: TaxonomyFields[]) {
  const categories = new Map<string, string>();
  const children = new Map<string, Map<string, string>>();
  const tagIds = new Set<string>();
  for (const row of rows) {
    if (row.categoryId) categories.set(row.categoryId, row.categoryName ?? "");
    if (row.categoryId && row.subcategoryId) {
      const kids = children.get(row.categoryId) ?? new Map<string, string>();
      kids.set(row.subcategoryId, row.subcategoryName ?? "");
      children.set(row.categoryId, kids);
    }
    // `?? []` although the contract requires it: a frontend deployed ahead of its backend got
    // rows without the field and the whole page crashed ("row.tagIds is not iterable").
    for (const tag of row.tagIds ?? []) tagIds.add(tag);
  }
  const list = (map: Map<string, string> | undefined): TaxonomyChoice[] =>
    [...(map ?? new Map<string, string>())].map(([id, name]) => ({ id, name })).sort(byName);
  return {
    categories: list(categories),
    subcategoriesOf: (categoryId: string | null) => (categoryId ? list(children.get(categoryId)) : []),
    tagIds,
  };
}
