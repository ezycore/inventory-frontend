// coding-standard: maintained
"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * Reach for this when an effect must run **before the browser paints** —
 * measuring layout, or correcting DOM that something else wrote during the same
 * commit. A passive `useEffect` runs *after* paint, so the intermediate state is
 * visible for a frame; that frame is what users report as a flicker or blink.
 *
 * The indirection exists only because React warns that `useLayoutEffect` does
 * nothing during SSR. Swapping it for `useEffect` there is safe: neither one
 * runs on the server, and the warning is the only difference.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
