"use client";
// coding-standard: maintained

import { useEffect, type RefObject } from "react";

/**
 * Publish the sticky header's height as `--sf-header-h` on `.sf-root`, so
 * anything that sticks to the TOP of the viewport can clear it.
 *
 * The sibling of `useBottomBarHeight`, and it exists for the mirror-image
 * collision: the header is `position: sticky; top: 0`, so a panel that sticks at
 * `top: 0` slides underneath it. Checkout's order rail is the first caller —
 * without this the Place-order button hides behind the search bar the moment the
 * shopper scrolls.
 *
 * MEASURED, not a constant, for a reason no default-size screenshot shows: the
 * storefront has **six** desktop header templates of different heights and
 * **five mobile ones** (`templates.mobile`) that range from a single 56px bar to
 * a logo row over a search field over a chip row — and every one of them grows
 * with the shopper's font size. A number that is right for Classic on desktop is
 * wrong for everything else.
 *
 * Takes the two bars separately rather than an array because that is what
 * exists — `StoreHeader` renders exactly one of each, switched by
 * `.sf-desktop-only` / `.sf-mobile-only`. The hidden one measures 0, so taking
 * the larger answers "which is on screen" without repeating that media query in
 * JS, and two stable refs keep the effect's dependencies honest.
 */
export function useHeaderHeight(
  mobileBar: RefObject<HTMLElement | null>,
  desktopBar: RefObject<HTMLElement | null>,
  /**
   * Whether the computer header follows the page (Header → Computer). Only a
   * dependency: flipping it in the Customize preview changes `position`
   * without resizing anything, so the observer below would never re-measure.
   */
  desktopSticky = true,
): void {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (!root) return;

    // A bar that does not stick scrolls away, so it leaves nothing to clear —
    // publishing its height would float every sticky panel (the catalogue's
    // filter bar, checkout's rail) a header's height below the top edge.
    const stuck = (el: HTMLElement | null) =>
      el && getComputedStyle(el).position === "sticky" ? el.offsetHeight : 0;
    const publish = () => {
      const height = Math.max(stuck(mobileBar.current), stuck(desktopBar.current));
      root.style.setProperty("--sf-header-h", `${Math.round(height)}px`);
    };
    publish();

    // The desktop bar wraps its nav on a narrow window and the mobile bar grows
    // when the search field wraps — both are resizes, neither is a re-render.
    const observer = new ResizeObserver(publish);
    if (mobileBar.current) observer.observe(mobileBar.current);
    if (desktopBar.current) observer.observe(desktopBar.current);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--sf-header-h");
    };
  }, [mobileBar, desktopBar, desktopSticky]);
}
