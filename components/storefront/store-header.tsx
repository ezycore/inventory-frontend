"use client";
// coding-standard: maintained

import { useRef } from "react";
import type { CatalogCategory, StorefrontStore } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartNav } from "@/services/storefront/use-cart-nav";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { useStoreMenu } from "@/components/storefront/use-store-menu";
import { useHeaderHeight } from "@/components/storefront/use-header-height";
import { MobileBar } from "@/components/storefront/mobile/mobile-chrome";
import {
  headerBar,
  UtilityBar,
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
import { logoImageUrl } from "@/lib/storefront-image";
import { storePages } from "@/lib/storefront-page-controls";
import { showsOn } from "@/lib/storefront-utility-bar";
import {
  useHeaderNeeds,
  useHeaderVariant,
  useResolvedUtilityBar,
} from "@/components/storefront/use-utility-bar";
import { useDesktopHeader } from "@/components/storefront/use-language-theme";

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
 * `header/desktop-variants.tsx` from `templates.header`. Reads the live preview
 * override first so switching repaints instantly.
 *
 * **Mobile is a separate axis with its own registry**, `templates.mobile`, drawn
 * by `components/storefront/mobile/`. It used to be one fixed bar shared by all
 * six desktop variants, on the reasoning that below 680px they all collapse to
 * the same thing anyway — true of the DESKTOP anatomies, and the wrong
 * conclusion: what a phone header should be is its own question (a hamburger and
 * a centred logo, or a search box, or four tabs at the bottom) and the answer
 * does not follow from the desktop one. Splitting the axis is also what stops
 * six near-identical mobile bars from existing — there is still exactly one
 * renderer, it just reads a value now.
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
  const previewBadges = useSfPreview((s) => s.badges);
  const previewLogo = useSfPreviewImage("logo", store?.logo);

  // The resolved menu, Customize draft first — shared with the phone bar and
  // the sidebar so the three can never disagree about what the menu is.
  const menu = useStoreMenu(store, categories, base);

  const variant = useHeaderVariant(store);
  const utilityBar = useResolvedUtilityBar(store);
  // Which optional pages this shop serves. Resolved once here and carried on
  // `ctx`, so a variant asks a boolean rather than reaching for the store —
  // six anatomies reading the payload themselves is six chances to read it
  // differently, and the default (absent ⇒ ON) is the part that must not vary.
  const pages = storePages(store);

  /* Who owes the shopper a theme / language control on DESKTOP. Resolved here
     because this is the only place that knows both halves — which bar is
     showing and which anatomy is about to render. */
  const desktopBarShows = showsOn(utilityBar, "desktop");
  const { needsTheme, needsLang } = useHeaderNeeds(store, "desktop");
  // Absent ⇒ it follows the page, as every header always has.
  const { sticky } = useDesktopHeader(store);

  const ctx: HeaderCtx = {
    base,
    name: store?.name ?? "Store",
    logo: logoImageUrl(previewLogo),
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
    menuTree: menu.tree,
    menuDesktop: menu.settings.desktop,
    cats: categories ?? [],
    hideCategoryRow,
    showSearch: pages.search,
    showAccount: pages.accounts,
    needsTheme,
    needsLang,
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

  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const Desktop = DESKTOP_VARIANTS[variant] ?? ClassicDesktop;

  // Publishes `--sf-header-h` so a top-sticky panel elsewhere on the page can
  // clear this bar instead of sliding under it (checkout's order rail).
  useHeaderHeight(mobileRef, desktopRef, sticky);

  return (
    <>
      {showsOn(utilityBar, "mobile") ? (
        <UtilityBar ctx={ctx} config={utilityBar} className="sf-mobile-only" />
      ) : null}
      {/* `mobileRef` goes ON the bar, never around it. `useHeaderHeight` needs
          the measurement, but the bar is `position: sticky` on four of the five
          templates and sticky is confined to its parent's box — a wrapper that
          exactly fits it leaves zero travel, so it scrolls away like a static
          element and the setting looks like it does nothing. */}
      <MobileBar
        slug={slug}
        base={base}
        store={store}
        categories={categories ?? []}
        barRef={mobileRef}
      />
      <div
        ref={desktopRef}
        className="sf-desktop-only"
        style={sticky ? headerBar : { ...headerBar, position: "relative" }}
      >
        {desktopBarShows ? <UtilityBar ctx={ctx} config={utilityBar} /> : null}
        <Desktop ctx={ctx} />
      </div>
    </>
  );
}
