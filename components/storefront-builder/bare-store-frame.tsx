"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import Link from "next/link";
import { faviconHref, type StorefrontStore } from "@/lib/storefront-client";
import { logoImageUrl } from "@/lib/storefront-image";
import { storeHref } from "@/lib/storefront-links";
import { designAttrs, resolveDesign } from "@/lib/storefront-theme";
import { activeColorStyle, shellTheme } from "@/lib/storefront-shell-theme";
import { useFaviconOverride } from "@/hooks/use-favicon-override";
import { useStore } from "@/services/storefront/hooks";
import { StoreContextProvider } from "@/services/storefront/store-context";
import { Brand } from "@/components/storefront/logo-mark";
import { ContactLauncher } from "@/components/storefront/contact-launcher";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartSync } from "@/components/storefront/cart-sync";
import { VisitSourceCapture } from "@/components/storefront/visit-source-capture";
import { OwnerAdminBar } from "@/components/storefront/owner-admin-bar";
import { useApplyLanguageTheme } from "@/components/storefront/use-language-theme";

/**
 * The frame for a Storefront Builder page with `chrome: "minimal"` or `"none"` —
 * the shop without its header, nav and footer.
 *
 * What it keeps is what makes the page still part of the shop rather than a
 * stranger's page with the shop's products on it:
 *  - the merchant's colours and type (`shellTheme`, `designAttrs`), stamped on
 *    `.sf-shell` exactly as `StoreShell` stamps them;
 *  - the store context and the seeded store query every product card, logo and
 *    cart line reads — this is the first consumer of that query here, the job
 *    `StoreShell` does on a full page;
 *  - the cart drawer and its server mirror, the floating contact button, and the
 *    owner bar.
 *
 * No Customize draft is read: the cached route never previews.
 */
export function BareStoreFrame({
  slug,
  base,
  store: initialStore,
  logoBar,
  children,
}: {
  slug: string;
  base: string;
  store: StorefrontStore;
  /** `chrome: "minimal"` — a bar with the store's logo, linking home. */
  logoBar: boolean;
  children: ReactNode;
}) {
  const { data } = useStore(slug, initialStore);
  const store = data ?? initialStore;
  useFaviconOverride(faviconHref(store.favicon));
  const theme = shellTheme(store.theme?.brandColor, store.theme?.accentColor);
  const design = resolveDesign(store.theme?.design);
  // A landing page is the shop too: a Bangla-only shop opens it in Bangla.
  const schemeAttr = useApplyLanguageTheme(store);

  return (
    <StoreContextProvider slug={slug} base={base}>
      <div
        className="sf-shell"
        data-brand={theme.brand ? "" : undefined}
        data-accent={theme.accent ? "" : undefined}
        /* No phone tab bar in this frame, so none of the 56px reserved for one. */
        data-sf-tabs="0"
        {...schemeAttr}
        {...designAttrs(design)}
        style={{
          ...theme.style,
          ...activeColorStyle(design),
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--page)",
          color: "var(--text)",
        }}
      >
        {logoBar ? (
          <header style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "12px var(--pad)" }}>
              <Link
                href={storeHref(base)}
                style={{ display: "inline-flex", color: "var(--text)", textDecoration: "none" }}
              >
                <Brand name={store.name} logo={logoImageUrl(store.logo)} markSize={34} nameSize={18} />
              </Link>
            </div>
          </header>
        ) : null}
        <main style={{ flex: 1 }}>{children}</main>
        <ContactLauncher base={base} store={store} />
        <CartDrawer />
        <OwnerAdminBar />
        <CartSync slug={slug} />
        <VisitSourceCapture />
      </div>
    </StoreContextProvider>
  );
}
