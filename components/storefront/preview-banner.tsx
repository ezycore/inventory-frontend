// coding-standard: maintained
import { PREVIEW_CLEAR_PARAM } from "@/lib/storefront-preview";

/**
 * Says out loud that this browser is in OWNER PREVIEW.
 *
 * Without it, preview is indistinguishable from the live shop, and the merchant
 * has no way to answer the only question that matters: *is my draft page public?*
 * It was reported exactly that way — "a draft page is visible from the public URL
 * and shows in the footer" — because the preview token is remembered in a cookie
 * for four hours (`proxy.ts`), so every page the merchant opens on that host stays
 * in preview long after they left the Customize editor.
 *
 * The drafts are **not** public. The token is org-scoped and verified server-side,
 * and a preview response is fetched `cache: "no-store"` so it never settles into
 * the shared `store:{slug}` entry another visitor would read. What was missing was
 * any way to see which of the two shops you are looking at.
 *
 * Server-rendered, and the exit is a plain link: `previewEnded=1` is read by the
 * proxy *before* the cookie, so the redirecting request is already out of preview
 * rather than clearing the cookie and serving one more draft on the way out.
 */
export function StorefrontPreviewBanner() {
  return (
    <div className="sf-preview-bar" role="status">
      <span>
        <strong>Preview mode.</strong> You are seeing unpublished pages and
        drafts. Shoppers do not see these.
      </span>
      {/* Relative, so it exits preview on whatever page the merchant is on. */}
      <a className="sf-preview-exit" href={`?${PREVIEW_CLEAR_PARAM}=1`}>
        Exit preview
      </a>
    </div>
  );
}
