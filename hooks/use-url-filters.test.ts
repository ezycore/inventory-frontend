import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FilterConfig } from "@/types/DataTable";

const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => params.current,
}));

const { useUrlFilters } = await import("@/hooks/use-url-filters");

/**
 * Seeding filters from the URL is what makes a "N Products" link land on a
 * filtered list. The regression guarded here: a MULTI-select bound to the raw
 * string rendered with nothing selected while the list was filtered — the
 * active filter was applied and invisible, clearable only via Reset.
 */
const config: FilterConfig = {
  fields: [
    { name: "search", label: "Search", type: "text" },
    { name: "brandId", label: "Brand", type: "select" },
    { name: "tags", label: "Tags", type: "select", mode: "multiple" },
  ],
};

/** Through `renderHook` so the hook runs inside a real React render. */
const filtersFrom = (query: string) => {
  params.current = new URLSearchParams(query);
  return renderHook(() => useUrlFilters(config)).result.current;
};

describe("useUrlFilters", () => {
  it("parses a multi-select into an array", () => {
    expect(filtersFrom("tags=a,b,c").tags).toEqual(["a", "b", "c"]);
  });

  it("parses a single-value multi-select into a one-item array", () => {
    // The shape a tag row's "N Products" link produces.
    expect(filtersFrom("tags=only-one").tags).toEqual(["only-one"]);
  });

  it("drops empty segments rather than emitting blank chips", () => {
    expect(filtersFrom("tags=a,,b,").tags).toEqual(["a", "b"]);
  });

  it("leaves single-mode selects and text as strings", () => {
    const filters = filtersFrom("brandId=b1&search=face");
    expect(filters.brandId).toBe("b1");
    expect(filters.search).toBe("face");
  });

  it("ignores params with no matching filter field", () => {
    expect(filtersFrom("nonsense=1")).toEqual({});
  });
});
