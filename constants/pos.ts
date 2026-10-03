// coding-standard: maintained
/**
 * The full-screen POS counter. Rendered without the sidebar shell — see the
 * POS branch in `ProtectedShell` (`components/layout/protected-shell.tsx`).
 * It sits under `/sales`, so `app/(protected)/sales/layout.tsx` guards it with
 * the New Sale gates (`sales.create` + the `sales` feature).
 */
export const POS_PATH = "/sales/pos";

/**
 * Every entry point opens the counter in its own tab, so the till stays up
 * beside the admin. The cart and an open draft carry across: the sell store
 * is persisted to localStorage, and a draft travels as `?draftId=`.
 */
export function openPos(href: string = POS_PATH): void {
  window.open(href, "_blank", "noopener,noreferrer");
}
