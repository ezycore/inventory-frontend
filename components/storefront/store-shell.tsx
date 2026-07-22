"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  ContentPageLink,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { useStore, useStoreCategories } from "@/services/storefront/hooks";
import { useFaviconOverride } from "@/hooks/use-favicon-override";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { StoreContextProvider } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { brightenForDark, readableTextOn } from "@/lib/color-contrast";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CampaignStrip } from "@/components/storefront/campaign-strip";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreBottomNav } from "@/components/storefront/store-bottom-nav";
import { StoreFooter } from "@/components/storefront/store-footer";
import { OwnerAdminBar } from "@/components/storefront/owner-admin-bar";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorePreviewBridge } from "@/components/storefront/preview-bridge";

/**
 * Storefront chrome — header (admin-selectable variant) + breadcrumb + footer
 * (admin-selectable variant), the cart slide-over and the owner admin bar.
 * Rendered by the server `shop/layout.tsx`, which passes `slug`/`base`;
 * everything reads them via context.
 */
export function StoreShell({
  slug,
  base,
  initialStore,
  initialPages,
  initialCampaigns,
  children,
}: {
  slug: string;
  base: string;
  initialStore?: StorefrontStore;
  initialPages?: ContentPageLink[];
  initialCampaigns?: StoreCampaign[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useStorefrontUI();

  const { data: store, isError } = useStore(slug, initialStore);
  const { data: fetchedCategories } = useStoreCategories(slug);
  const previewBrand = useSfPreview((s) => s.brand);
  const previewCollections = useSfPreview((s) => s.collections);
  const previewAnnouncement = useSfPreview((s) => s.announcement);

  // The admin's Collections panel streams its unsaved draft; prefer it so
  // reordering/hiding previews live instead of waiting on a save + refetch.
  const categories = previewCollections ?? fetchedCategories;

  // Tab icon = the store's logo, swapped in place so router-integrated
  // navigations (page changes AND the account tab switch's replaceState) don't
  // flash the platform default — that's why it's a client hook, not layout
  // metadata (see use-favicon-override).
  useFaviconOverride(store?.logo?.thumbnailUrl || store?.logo?.url);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-[var(--muted)]">
          This store doesn&apos;t exist or isn&apos;t published yet.
        </p>
      </div>
    );
  }

  // Live preview brand (admin Customize editor) wins so the whole page repaints
  // instantly; otherwise the merchant's saved brand colour overrides --primary.
  // Both theme variants ship as vars — storefront.css picks per data-theme, so
  // a dark brand is auto-lifted on the dark theme and stays readable.
  const brandColor = previewBrand ?? store?.theme?.brandColor;
  const darkBrand = brandColor ? brightenForDark(brandColor) : undefined;
  const shellVars = (brandColor
    ? {
        "--sf-brand-light": brandColor,
        "--sf-brand-dark": darkBrand,
        "--sf-brand-on-light": readableTextOn(brandColor),
        "--sf-brand-on-dark": readableTextOn(darkBrand ?? brandColor),
      }
    : {}) as CSSProperties;

  // Live preview override (admin Navigation editor) wins so the bar repaints as
  // it's edited; otherwise the merchant's saved announcement.
  const announcement = previewAnnouncement ?? store?.nav?.announcement;

  const onHome = pathname === base || pathname === `${base}/` || pathname === "/";
  const crumb = !onHome ? crumbLabel(pathname, t) : "";

  return (
    <StoreContextProvider slug={slug} base={base}>
      <div
        className="sf-shell"
        data-brand={brandColor ? "" : undefined}
        style={{
          ...shellVars,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--page)",
          color: "var(--text)",
        }}
      >
        {/* Announcement bar — admin Navigation tab (icon, CTA, dismissible). */}
        <AnnouncementBar announcement={announcement} base={base} slug={slug} />

        {/* Header — admin-selectable variant (templates.header). */}
        <StoreHeader
          slug={slug}
          base={base}
          store={store}
          categories={categories ?? []}
        />

        {/* Running-campaign promo strip (only when a campaign window is live). */}
        <CampaignStrip
          slug={slug}
          base={base}
          currency={store?.currency}
          initialCampaigns={initialCampaigns}
        />

        {/* Breadcrumb */}
        {crumb ? (
          <div
            className="sf-noprint"
            style={{
              maxWidth: "var(--maxw)",
              margin: "0 auto",
              width: "100%",
              padding: "14px var(--pad) 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
            }}
          >
            <Link href={storeHref(base)} style={{ color: "var(--muted)" }}>
              {t.navHome}
            </Link>
            <span style={{ color: "var(--faint)" }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{crumb}</span>
          </div>
        ) : null}

        <main style={{ flex: 1 }}>{children}</main>

        {/* Footer — admin-selectable variant (templates.footer). */}
        <StoreFooter
          slug={slug}
          base={base}
          store={store}
          initialPages={initialPages}
        />

        {/* Mobile bottom tab bar (hidden ≥680px). */}
        <StoreBottomNav
          slug={slug}
          base={base}
          store={store}
          categories={categories ?? []}
        />

        <CartDrawer />
        <OwnerAdminBar />
        <StorePreviewBridge />
      </div>
    </StoreContextProvider>
  );
}

function crumbLabel(pathname: string, t: Dict): string {
  if (/\/products\/[^/]+$/.test(pathname)) return t.navProduct;
  if (/\/products(\?|$)/.test(pathname) || /\/products$/.test(pathname)) return t.navShop;
  if (pathname.includes("/search")) return t.navSearch;
  if (pathname.includes("/cart")) return t.navCart;
  if (pathname.includes("/checkout")) return t.navCheckout;
  if (pathname.includes("/account")) return t.navAccount;
  return "";
}
