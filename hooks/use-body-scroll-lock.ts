// coding-standard: maintained
import { useEffect } from "react";

/**
 * Freezes the page behind a full-screen overlay (drawer / sheet / takeover)
 * and restores the exact scroll position on close.
 *
 * `overflow: hidden` on <body> alone is NOT enough on iOS Safari — it keeps
 * scrolling the page under the overlay, so an overscroll inside a drawer list
 * moves the catalogue behind it and the shopper loses their place. The reliable
 * cross-browser recipe is to take the body out of flow (`position: fixed`)
 * offset by the current scroll, then scroll back to it on unlock.
 *
 * Only one overlay is open at a time in the storefront, so this deliberately
 * does not ref-count nested locks.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      // Restoring position alone drops the page back to the top — the offset
      // that kept the scroll visible was the inline `top`, not a real scroll.
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
