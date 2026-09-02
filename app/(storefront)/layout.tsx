// coding-standard: maintained
import type { ReactNode } from "react";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import { STOREFRONT_FONT_VARS } from "./fonts";
import "./storefront.css";

// Set the stored theme before paint so dark-mode users don't flash light.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('ezy-sf-theme');var r=document.querySelector('.sf-root');if(r){if(t==='dark')r.setAttribute('data-theme','dark');var l=localStorage.getItem('ezy-sf-lang');if(l==='bn')r.setAttribute('lang','bn');}}catch(e){}})();`;

/**
 * Storefront route-group shell. Scopes the storefront design system (`.sf-root`
 * tokens + the type families in `./fonts`) so it's fully decoupled from the
 * admin app, and provides theme (light/dark) + language (EN/BN) via
 * `StorefrontUIProvider`. Server Component so pages render SEO-friendly HTML.
 *
 * Every font family's CSS variable is published here; which one a store actually
 * renders is decided further down by `StoreShell`'s `data-font` attribute, since
 * the merchant's choice is per-store data and this layout is shared by all of them.
 */
export default function StorefrontGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
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
        <StorefrontUIProvider>{children}</StorefrontUIProvider>
      </div>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
    </>
  );
}
