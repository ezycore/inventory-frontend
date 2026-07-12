// coding-standard: maintained
import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/**
 * `false` during SSR and the hydration render, `true` afterwards — without an
 * effect-driven setState. Use it to mask client-only state (persisted zustand
 * stores, `window`, locale) so the first client render matches the server HTML
 * and never triggers a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
