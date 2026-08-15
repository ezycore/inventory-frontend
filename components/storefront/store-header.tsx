"use client";
// coding-standard: maintained

import Link from "next/link";
import type {
  CatalogCategory,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveHeaderMenu, resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartNav } from "@/services/storefront/use-cart-nav";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { Icon } from "@/components/storefront/sf-icons";
import { expandHeaderMenu } from "@/components/storefront/header-nav";
import { Brand } from "@/components/storefront/logo-mark";
import { HeaderSearchMobile } from "@/components/storefront/header-search";
import {
  bareBtn,
  headerBar,
  tapPad,
  type HeaderCtx,
} from "@/components/storefront/header/header-shared";
import {
  BoutiqueDesktop,
  CenteredDesktop,
  ClassicDesktop,
  ClinicalDesktop,
  MinimalDesktop,
  SearchFirstDesktop,
} from "@/components/storefront/header/desktop-variants";

/** Desktop anatomies, in `TEMPLATE_OPTIONS.header` order. */
const HEADER_VARIANTS: readonly string[] = [
  "classic",
  "minimal",
  "centered",
  "search-first",
  "clinical",
  "boutique",
];

const DESKTOP_VARIANTS: Record<string, (props: { ctx: HeaderCtx }) => React.ReactNode> = {
  classic: ClassicDesktop,
  minimal: MinimalDesktop,
  centered: CenteredDesktop,
  "search-first": SearchFirstDesktop,
  clinical: ClinicalDesktop,
  boutique: BoutiqueDesktop,
};

/**
 * Storefront header — picks one of the desktop anatomies in
 * `header/desktop-variants.tsx` from `templates.header`; the mobile header is
 * shared by all of them. Reads the live preview override first so switching
 * repaints instantly.
 *
 * Mobile deliberately has no per-variant version: below 680px every one of these
 * collapses to the same thing (logo, toggles, search) because there is no room
 * for them to differ, and five near-identical mobile bars would be five places
 * to fix the next touch-target bug.
 */
export function StoreHeader({
  slug,
  base,
  store,
  categories,
  hideCategoryRow,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
  /** Set by the `rail` shell, which lists departments itself. */
  hideCategoryRow?: boolean;
}) {
  const { t, theme, lang, toggleTheme, toggleLang } = useStorefrontUI();
  const { cartCount, cartSubtotal, goCart } = useCartNav(slug);
  const shopper = useShopperStore((s) => s.shopper);
  const hydrated = useHydrated();
  const previewHeader = useSfPreview((s) => s.header);
  const previewMenuSrc = useSfPreview((s) => s.headerMenuSrc);
  const previewNavHeader = useSfPreview((s) => s.navHeader);
  const previewBadges = useSfPreview((s) => s.badges);
  const previewLogo = useSfPreviewImage("logo", store?.logo);

  // Drafts from the admin Navigation editor win over the saved store payload.
  // The legacy-fallback check uses the RAW menu (a store whose menu is only a
  // collections block with zero listed collections still chose "custom");
  // ctx gets the menu with collections blocks expanded into category links.
  const rawMenu = previewNavHeader ?? store?.nav?.header ?? [];
  const headerMenu = expandHeaderMenu(rawMenu, categories ?? []);
  const menuSource = resolveHeaderMenu(
    { ...store?.templates, ...(previewMenuSrc ? { headerMenu: previewMenuSrc } : {}) },
    rawMenu.length > 0,
  );

  const ctx: HeaderCtx = {
    base,
    name: store?.name ?? "Store",
    logo: previewLogo?.url || previewLogo?.thumbnailUrl,
    phone: store?.contact?.phone ?? "",
    t,
    theme,
    lang,
    toggleTheme,
    toggleLang,
    shopperName: shopper?.name,
    sessionKnown: hydrated,
    cartCount,
    cartSubtotal,
    currency: store?.currency,
    goCart,
    headerMenu,
    menuSource,
    cats: categories ?? [],
    hideCategoryRow,
    // "Delivery inside Dhaka in 24h" and the like. There is no dedicated
    // delivery-promise field and there should not be one — the merchant already
    // writes exactly this sentence as their first trust badge, so the chip
    // reuses it and simply does not render for a shop that set none.
    //
    // Draft first, like every other value in this file: the Customize editor
    // streams badges into the preview store, so reading only the saved store
    // left the chip frozen while the footer beside it repainted — the merchant
    // would have typed their delivery promise and watched the header ignore it.
    deliveryPromise:
      (previewBadges ?? store?.trustBadges)?.[0]?.text?.trim() || undefined,
  };

  const variant: StoreTemplates["header"] = HEADER_VARIANTS.includes(
    previewHeader ?? "",
  )
    ? (previewHeader as StoreTemplates["header"])
    : resolveTemplates(store).header;
  const Desktop = DESKTOP_VARIANTS[variant] ?? ClassicDesktop;

  return (
    <>
      <MobileHeader ctx={ctx} />
      <div className="sf-desktop-only" style={headerBar}>
        <Desktop ctx={ctx} />
      </div>
    </>
  );
}

/* -------------------------------- mobile ---------------------------------- */

function MobileHeader({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo, t, theme, lang, toggleTheme, toggleLang, cats } = ctx;
  // Cart + account live in the bottom nav on mobile, so the top bar keeps just
  // the logo, locale/theme toggles and the search field.
  return (
    <div className="sf-mobile-only" style={{ ...headerBar, padding: "14px 14px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brand name={name} logo={logo} markSize={29} nameSize={15.5} />
        </Link>
        {/* `tapPad` (padding + matching negative margin) lifts these from an
            18px glyph to a 42px touch target without moving them or changing
            the gap between them. */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button type="button" onClick={toggleLang} style={{ ...bareBtn, ...tapPad, fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
          <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? t.lightMode : t.darkMode} style={{ ...bareBtn, ...tapPad, display: "flex", color: "var(--text)" }}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
        </div>
      </div>
      <HeaderSearchMobile categories={cats} />
    </div>
  );
}
