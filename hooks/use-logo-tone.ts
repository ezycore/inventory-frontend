"use client";
// coding-standard: maintained
import { useEffect, useState } from "react";
import { analyzeLogoTone, type LogoTone } from "@/lib/logo-tone";

/**
 * The ink tone of a store logo, or `null` while unknown / not worth acting on.
 * See `lib/logo-tone.ts` for what is being measured and why.
 *
 * The state carries the `src` it was measured from, and a result for a
 * different (or absent) logo reads as `null` on the way out. That is why the
 * effect never resets anything: a `setState` in an effect body to clear stale
 * state is a cascading render, and the same answer is available by derivation.
 *
 * It also never seeds from the module cache. A cache hit during the hydration
 * render would make the client's first paint disagree with the server HTML,
 * which is a hydration error for a purely cosmetic gain — and a hit resolves in
 * a microtask anyway, so the corrected paint lands in the same frame.
 */
export function useLogoTone(src: string | undefined): LogoTone {
  const [measured, setMeasured] = useState<{ src: string; tone: LogoTone } | null>(
    null,
  );

  useEffect(() => {
    if (!src) return;
    let active = true;
    void analyzeLogoTone(src).then((tone) => {
      if (active) setMeasured({ src, tone });
    });
    return () => {
      active = false;
    };
  }, [src]);

  return measured?.src === src ? measured.tone : null;
}
