// coding-standard: maintained
"use client";

import { useState } from "react";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

/**
 * Whether a CSS media query matches, kept current as the window resizes or a
 * tablet rotates.
 *
 * Use it when the answer decides what to MOUNT, not just how it looks — e.g.
 * the POS renders its customer form in exactly one place (beside the cart on a
 * desktop, in the checkout sheet on a phone), because a form field mounted
 * twice registers twice. For looks alone, use a Tailwind breakpoint.
 *
 * `false` on the server and the first render; corrected before paint.
 */
export function useMatchesMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
