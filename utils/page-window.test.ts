import { describe, expect, it } from "vitest";
import { pageWindow } from "@/utils/page-window";

/**
 * These lock the window that `DataTablePagination` has always rendered — the
 * extraction had to be behaviour-preserving, because every list page in the app
 * draws its pager from it.
 */
describe("pageWindow", () => {
  it("lists every page when they all fit", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("renders nothing when there are no pages", () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });

  it("pins the last page on, with a gap once it hides more than one", () => {
    // 4 is adjacent to the window, so it is shown rather than collapsed.
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, "gap", 10]);
  });

  it("pins the first page on the same way", () => {
    expect(pageWindow(10, 10)).toEqual([1, "gap", 8, 9, 10]);
    expect(pageWindow(4, 4)).toEqual([1, 2, 3, 4]);
  });

  it("gaps both sides in the middle", () => {
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });

  it("slides the window back rather than rendering short at the end", () => {
    // Without the slide this would be [.., 9, 10] — two slots, not three.
    expect(pageWindow(9, 10)).toEqual([1, "gap", 8, 9, 10]);
  });

  it("always contains the current page, across a whole run", () => {
    for (let page = 1; page <= 12; page++) {
      expect(pageWindow(page, 12)).toContain(page);
    }
  });

  it("honours a wider window", () => {
    expect(pageWindow(6, 20, 5)).toEqual([1, "gap", 4, 5, 6, 7, 8, "gap", 20]);
  });
});
