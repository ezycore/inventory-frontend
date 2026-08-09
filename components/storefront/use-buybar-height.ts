"use client";
// coding-standard: maintained

import { useEffect, type RefObject } from "react";

/**
 * Publish a bottom-pinned bar's height as `--sf-buybar-h` on `.sf-root`, so
 * anything else anchored to the bottom of the viewport can stack above it.
 *
 * Only the product page's sticky buy bar uses this today, and it exists for one
 * concrete collision: the contact launcher anchors to
 * `--sf-bottom-nav-h + --sf-buybar-h + 14px`. Clearing only the mobile tab bar
 * drops it straight onto Add-to-cart — the most valuable tap on the storefront —
 * on every mobile product page, while looking perfectly fine on the home page,
 * on desktop, and in every screenshot taken while building it.
 *
 * MEASURED rather than hard-coded: the bar's height moves with the shopper's
 * font size and with a long product name wrapping to a second line, and a
 * constant that is right at the default size is wrong for anyone who has zoomed.
 *
 * Resets to `0px` on unmount, which is what makes the launcher drop back down on
 * every other page — the shell (and this variable) survive client-side
 * navigation, so a stale value would push the button up a phantom bar's worth
 * for the rest of the session.
 */
export function useBuybarHeight(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (!root) return;

    const clear = () => root.style.removeProperty("--sf-buybar-h");
    if (!active) {
      clear();
      return clear;
    }

    const publish = () => {
      const el = ref.current;
      if (el) root.style.setProperty("--sf-buybar-h", `${Math.round(el.offsetHeight)}px`);
    };
    publish();

    // The bar grows when a variant with a longer label is picked, and when the
    // viewport narrows enough to wrap its title — both are resizes, neither is
    // a re-render this hook would otherwise see.
    const observer = new ResizeObserver(publish);
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [ref, active]);
}
