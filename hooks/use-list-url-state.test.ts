import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterField } from "@/types/filter";

const nav = vi.hoisted(() => ({ params: new URLSearchParams(), pathname: "/products" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.params,
  usePathname: () => nav.pathname,
}));

const { useListUrlState } = await import("@/hooks/use-list-url-state");

const fields: FilterField[] = [
  { name: "search", label: "Search", type: "text" },
  { name: "tags", label: "Tags", type: "select", mode: "multiple" },
];

/**
 * The bug this exists for: a merchant on page 3 of their orders opens one and
 * presses Back, and lands on page 1 with every filter gone — the list kept its
 * place only in component state, which the navigation threw away.
 */
describe("useListUrlState", () => {
  let replaceState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nav.params = new URLSearchParams();
    window.history.replaceState(null, "", "/products");
    replaceState = vi.spyOn(window.history, "replaceState");
  });
  afterEach(() => replaceState.mockRestore());

  const render = (options: Partial<Parameters<typeof useListUrlState>[0]> = {}) =>
    renderHook(() =>
      useListUrlState({ defaults: { limit: 10 }, filterFields: fields, limitOptions: [10, 20], ...options }),
    );

  const lastUrl = () => replaceState.mock.calls.at(-1)?.[2];

  it("opens where the URL says — the page Back returns to", () => {
    nav.params = new URLSearchParams("page=3&tags=a,b");
    const { result } = render();
    expect(result.current).toMatchObject({ page: 3, limit: 10, filters: { tags: ["a", "b"] } });
  });

  it("writes a page turn to the URL without adding a history entry", () => {
    const { result } = render();
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    expect(lastUrl()).toBe("/products?page=3");
  });

  it("starts again from page 1 when the filters, size or sort change", () => {
    const { result } = render();
    act(() => result.current.setPage(4));
    act(() => result.current.setFilters({ search: "face" }));
    expect(result.current.page).toBe(1);
    expect(lastUrl()).toBe("/products?search=face");

    act(() => result.current.setPage(2));
    act(() => result.current.setLimit(20));
    expect(result.current).toMatchObject({ page: 1, limit: 20 });

    act(() => result.current.setPage(2));
    act(() => result.current.setSort("name", "asc"));
    expect(result.current.page).toBe(1);
  });

  it("returns to the bare path when everything is back at its default", () => {
    nav.params = new URLSearchParams("page=2&search=face");
    window.history.replaceState(null, "", "/products?page=2&search=face");
    const { result } = render();
    act(() => result.current.reset());
    expect(lastUrl()).toBe("/products");
  });

  it("keeps the rest of the query string", () => {
    window.history.replaceState(null, "", "/products?returnTo=%2Fdashboard");
    const { result } = render();
    act(() => result.current.setPage(2));
    expect(lastUrl()).toBe("/products?returnTo=%2Fdashboard&page=2");
  });

  // Clicking the sidebar link to the same list lands on the bare path with the
  // page still mounted: the URL is the newer truth, and the filter bar must be
  // told (via `revision`) to show it.
  it("follows the URL when it changes from outside", () => {
    nav.params = new URLSearchParams("page=5&search=face");
    const { result, rerender } = render();
    const before = result.current.revision;

    nav.params = new URLSearchParams();
    rerender();

    expect(result.current).toMatchObject({ page: 1, filters: {} });
    expect(result.current.revision).toBe(before + 1);
  });

  it("does not mistake its own write for an outside change", () => {
    const { result, rerender } = render();
    act(() => result.current.setPage(3));
    nav.params = new URLSearchParams("page=3");
    rerender();
    expect(result.current).toMatchObject({ page: 3, revision: 0 });
  });

  it("with sync off, neither reads nor writes the URL — for a list inside a sheet", () => {
    nav.params = new URLSearchParams("page=5");
    const { result } = render({ sync: false });
    expect(result.current.page).toBe(1);
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
