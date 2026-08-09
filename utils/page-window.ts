// coding-standard: maintained
/**
 * Which page numbers a pager should show, and where the "…" gaps fall.
 *
 * Extracted verbatim from `DataTablePagination`, which had it inline, when the
 * hand-rolled ecommerce list pages needed the same window: two copies of a
 * paging window drift, and the whole point of that change was that the two
 * pagers should look and behave identically.
 *
 * The window is **not** a fixed width — it is `maxVisible` pages around the
 * current one, plus the first and last page pinned on, plus a gap wherever that
 * skips more than one page. So it renders between 1 and `maxVisible + 4` slots.
 * (The storefront's own `pageItems` in `components/storefront/pager.tsx` is
 * deliberately a *different* algorithm — constant width, so a shopper walking a
 * collection never has the buttons slide under the cursor. Admin tables are
 * denser and jump around by search and filter, where pinning the width buys
 * nothing. Two audiences, two answers; do not merge them.)
 */

/** One slot: a page to jump to, or a collapsed run of them. */
export type PageSlot = number | "gap";

/**
 * @param currentPage 1-based.
 * @param totalPages  0 yields an empty list, so a pager can render nothing.
 * @param maxVisible  pages shown around the current one, before the pinned ends.
 */
export function pageWindow(
  currentPage: number,
  totalPages: number,
  maxVisible = 3,
): PageSlot[] {
  const slots: PageSlot[] = [];
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Near the end there are not `maxVisible` pages left to the right, so the
  // window slides back rather than rendering short.
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) slots.push(i);

  // The ends are always reachable. A gap is only worth drawing when it hides
  // more than one page — "1 … 3" costs the same width as "1 2 3" and tells the
  // reader less.
  if (startPage > 1) {
    slots.unshift(1);
    if (startPage > 2) slots.splice(1, 0, "gap");
  }
  if (endPage < totalPages) {
    slots.push(totalPages);
    if (endPage < totalPages - 1) slots.splice(slots.length - 1, 0, "gap");
  }

  return slots;
}
