// coding-standard: maintained
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * Does this business count stock?
 *
 * The frontend mirror of the backend's `utils/stock-tracking.ts`, and it exists
 * for the same reason that file does: the comparison is one line, the convention
 * around it is not.
 *
 * **`!== false`, never `=== true`.** A features map with the key absent must read
 * as TRACKED — that is the shape of every org written before the flag, and of
 * any response a branch trimmed. `=== true` would switch stock off for the whole
 * customer base at once. Same convention as `isStockTracked` and `requireFeature`
 * on the server.
 *
 * **It answers a vocabulary question, not just a layout one.** A QA pass over a
 * storefront-only workspace found twelve surfaces promising things stock makes
 * true and this tier does not: three order dialogs offering to reserve, consume
 * and release stock that is never held, a product form headed "Stock levels and
 * low-stock alerts", a store setting asking what to do when a product runs out,
 * a checkout telling the shopper their stock was re-checked. Every one read a
 * features map ad hoc or not at all. One hook so the next surface has somewhere
 * obvious to ask.
 */
export function useStockTracked(): boolean {
  return useAuthStore(
    (state) => state.user?.organization?.features?.inventoryTracking !== false,
  );
}
