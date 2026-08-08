"use client";
// coding-standard: maintained
import { useEffect, useState } from "react";
import { analyzeLogoTone, type LogoTone } from "@/lib/logo-tone";

/**
 * The ink tone of a store logo, or `null` while unknown / not worth acting on.
 * See `lib/logo-tone.ts` for what is being measured and why.
 *
 * Always starts at `null`, never seeded from the module cache: a cache hit
 * during the hydration render would make the client's first paint disagree with
 * the server HTML, which is a hydration error for a purely cosmetic gain. A hit
 * resolves in a microtask anyway, so the corrected paint lands in the same frame.
 */
export function useLogoTone(src: string | undefined): LogoTone {
  const [tone, setTone] = useState<LogoTone>(null);

  useEffect(() => {
    if (!src) {
      setTone(null);
      return;
    }
    let active = true;
    void analyzeLogoTone(src).then((next) => {
      if (active) setTone(next);
    });
    return () => {
      active = false;
    };
  }, [src]);

  return tone;
}
