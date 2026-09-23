"use client";
// coding-standard: maintained

import { useEffect, type RefObject } from "react";

/**
 * Publish a bottom-pinned bar's height as a CSS variable on `.sf-root`, so
 * anything else anchored to the bottom of the viewport can stack above it.
 *
 * Two bars use it, and it exists for one concrete collision each. The contact
 * launcher anchors to `--sf-bottom-nav-h + --sf-buybar-h + --sf-consent-h + 14px`:
 *
 *  - `--sf-buybar-h` — the product page's sticky buy bar. Clearing only the
 *    mobile tab bar drops the launcher straight onto Add-to-cart — the most
 *    valuable tap on the storefront — on every mobile product page, while looking
 *    perfectly fine on the home page, on desktop, and in every screenshot taken
 *    while building it.
 *  - `--sf-consent-h` — the cookie consent bar, whose own buttons sit exactly
 *    where the launcher floats.
 *
 * MEASURED rather than hard-coded: a bar's height moves with the shopper's font
 * size and with a long product name wrapping to a second line, and a constant
 * that is right at the default size is wrong for anyone who has zoomed.
 *
 * Resets to `0px` on unmount, which is what makes the launcher drop back down on
 * every other page — the shell (and these variables) survive client-side
 * navigation, so a stale value would push the button up a phantom bar's worth
 * for the rest of the session.
 */
export function useBottomBarHeight(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  /** Defaults to the buy bar's, which was this hook's only caller until the consent bar. */
  cssVar: "--sf-buybar-h" | "--sf-consent-h" = "--sf-buybar-h",
): void {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (!root) return;

    const clear = () => root.style.removeProperty(cssVar);
    if (!active) {
      clear();
      return clear;
    }

    const publish = () => {
      const el = ref.current;
      if (el) root.style.setProperty(cssVar, `${Math.round(el.offsetHeight)}px`);
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
  }, [ref, active, cssVar]);
}
