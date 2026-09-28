import { describe, expect, it } from "vitest";
import { toBulkFilter, toBulkTarget } from "./bulk-filter";

describe("toBulkFilter", () => {
  it("keeps only the list's filters, and drops empty ones", () => {
    expect(
      toBulkFilter({ search: "  cushion ", categoryId: "", brandId: undefined, page: 2, status: "active" }),
    ).toEqual({ search: "cushion", status: "active" });
  });

  it("normalises tags from an array or a comma-joined URL value", () => {
    expect(toBulkFilter({ tags: ["a", "b"] })).toEqual({ tags: ["a", "b"] });
    expect(toBulkFilter({ tags: "a, b," })).toEqual({ tags: ["a", "b"] });
    expect(toBulkFilter({ tags: [] })).toEqual({});
  });
});

describe("toBulkTarget", () => {
  const base = { count: 2, clear: () => {} };
  it("sends ids for a hand-picked selection", () => {
    expect(
      toBulkTarget({ ...base, ids: ["1", "2"], allMatching: false, filters: { search: "x" } }),
    ).toEqual({ ids: ["1", "2"] });
  });

  it("sends the filter for 'all matching'", () => {
    expect(
      toBulkTarget({ ...base, ids: [], allMatching: true, filters: { search: "x" } }),
    ).toEqual({ filter: { search: "x" } });
  });
});
