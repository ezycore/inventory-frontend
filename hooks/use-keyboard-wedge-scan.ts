// coding-standard: maintained
import { useMemo, useRef } from "react";

/** Consecutive fast keys before a burst counts as a scanner, not a person. */
const MIN_FAST_KEYS = 3;

/**
 * Tell a keyboard-wedge barcode scanner from a person typing in the same box.
 *
 * A USB/Bluetooth scanner "types" the code a few milliseconds per character and
 * ends with Enter; nobody types that fast. Feed every keydown to `track(key)`,
 * then ask `isScan()` when Enter arrives. `reset()` after acting on the input.
 *
 * Same timing rule as `<BarcodeInput>` (`components/shared/barcode`), which
 * owns a box that only ever scans; this is for a box that also searches.
 */
export function useKeyboardWedgeScan(gapMs = 30) {
  const lastKeyAt = useRef(0);
  const fastKeys = useRef(0);

  return useMemo(
    () => ({
      track(key: string) {
        if (key.length !== 1) return;
        const now = performance.now();
        fastKeys.current =
          lastKeyAt.current && now - lastKeyAt.current < gapMs
            ? fastKeys.current + 1
            : 0;
        lastKeyAt.current = now;
      },
      isScan() {
        return fastKeys.current >= MIN_FAST_KEYS;
      },
      reset() {
        lastKeyAt.current = 0;
        fastKeys.current = 0;
      },
    }),
    [gapMs],
  );
}
