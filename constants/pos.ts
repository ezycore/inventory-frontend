// coding-standard: maintained
/**
 * The full-screen POS counter. Rendered without the sidebar shell — see the
 * POS branch in `ProtectedShell` (`components/layout/protected-shell.tsx`).
 * It sits under `/sales`, so `app/(protected)/sales/layout.tsx` guards it with
 * the New Sale gates (`sales.create` + the `sales` feature).
 */
export const POS_PATH = "/sales/pos";
