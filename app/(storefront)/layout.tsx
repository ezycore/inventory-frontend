// coding-standard: maintained
import type { ReactNode } from "react";
import QueryProvider from "@/components/providers/query-provider";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import { StorefrontToaster } from "@/components/storefront/storefront-toaster";
import { STOREFRONT_FONT_VARS } from "./fonts";
import "./storefront-base.css";
import "./storefront.css";
// Storefront Builder section frame (`.sfb-*`). Loaded here rather than by the
// renderer: a CSS import inside a component breaks every vitest file that
// imports it, and this sheet is small enough to ride on every shop page.
import "./storefront-builder.css";

// Set the stored theme before paint so dark-mode users don't flash light.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('ezy-sf-theme');var r=document.querySelector('.sf-root');if(r){if(t==='dark')r.setAttribute('data-theme','dark');var l=localStorage.getItem('ezy-sf-lang');if(l==='bn')r.setAttribute('lang','bn');}}catch(e){}})();`;

/**
 * Root layout for the public storefront — its own `<html>` document, separate
 * from the admin app's (`components/layout/admin-root-layout.tsx`).
 *
 * Two things this layout must never regain, because each one is why it exists:
 *  - **the admin stylesheet.** `storefront-base.css` is the storefront's own
 *    Tailwind build; the admin's 312 KB sheet was render-blocking on every shop.
 *  - **a read of the request.** No `headers()`, no `cookies()`, no next-intl
 *    locale here. Anything a root layout reads makes every page beneath it
 *    dynamic, which is what kept shop pages out of the HTML cache. Per-request
 *    state belongs in the page that needs it, or in the client.
 *
 * Scopes the storefront design system (`.sf-root` tokens + the type families in
 * `./fonts`) and provides theme (light/dark) + language (EN/BN) via
 * `StorefrontUIProvider`. TanStack Query is the only admin provider the shop
 * uses, so it is the only one carried over.
 *
 * Every font family's CSS variable is published here; which one a store actually
 * renders is decided further down by `StoreShell`'s `data-font` attribute, since
 * the merchant's choice is per-store data and this layout is shared by all of them.
 */
export default function StorefrontRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {/* `suppressHydrationWarning` because NO_FLASH below deliberately rewrites
              this element's `data-theme` and `lang` BEFORE React hydrates — that is
              the entire point of a no-flash script, and it guarantees the DOM will
              not match the server HTML (which is always `light` and carries no
              `lang`). Without this, every dark-mode or Bangla shopper got a React
              hydration error on every storefront page.

              It is shallow by design: it silences the mismatch on THIS element's own
              attributes only, never its children, so a genuine hydration bug
              anywhere inside still reports. */}
          <div
            className={`sf-root min-h-screen ${STOREFRONT_FONT_VARS}`}
            data-theme="light"
            suppressHydrationWarning
          >
            <StorefrontUIProvider>
              {children}
              {/* Inside the provider because it follows the SHOPPER's theme — see
                  `StorefrontToaster`. It portals to the body itself, so its
                  position in the tree costs nothing. */}
              <StorefrontToaster />
            </StorefrontUIProvider>
          </div>
          <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        </QueryProvider>
      </body>
    </html>
  );
}
