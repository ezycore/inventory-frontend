"use client";
// coding-standard: maintained

import { useCallback } from "react";
import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  StorefrontStore,
} from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import type {
  MobileActionId,
  MobileChrome as Chrome,
} from "@/lib/storefront-mobile";
import { keptSlot } from "@/lib/storefront-mobile";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useMobileNav } from "@/services/stores/use-mobile-nav-store";
import { Brand } from "@/components/storefront/logo-mark";
import { Icon } from "@/components/storefront/sf-icons";
import { HeaderSearchMobile } from "@/components/storefront/header-search";
import {
  MobileAction,
  type MobileActionCtx,
} from "@/components/storefront/mobile/mobile-actions";
import { MobileMenuPanel } from "@/components/storefront/mobile/mobile-menu";
import {
  useMobileBrandLogo,
  useMobileChrome,
} from "@/components/storefront/mobile/use-mobile-chrome";
import { headerNeeds } from "@/lib/storefront-utility-bar";
import { useResolvedUtilityBar } from "@/components/storefront/use-utility-bar";

/**
 * The phone chrome — **one renderer for every mobile template**.
 *
 * There is deliberately no per-template component and no `switch` on the
 * template id anywhere below. A template is a `MobileChrome` value
 * (`lib/storefront-mobile.ts`); this file draws whatever that value says, so
 * template number twenty costs a shopper's phone nothing but the bytes of the
 * object describing it, and costs this file no lines at all.
 *
 * Three exports, because the pieces are pinned to three different places in the
 * page and no shell can hold all of them:
 *  - `MobileBar`     — the top bar, drawn where each shell puts its header.
 *  - `MobileTabs`    — the bottom bar, pinned to the viewport by `StoreShell`.
 *  - `MobileOverlays`— the menu panel and the search takeover, mounted once.
 */

const barStyle = (sticky: boolean): CSSProperties => ({
  background: "var(--card)",
  borderBottom: "1px solid var(--border)",
  padding: "10px 14px",
  ...(sticky
    ? { position: "sticky", top: 0, zIndex: 30 }
    : { position: "relative" }),
});

/* ================================ shared ctx ============================== */

/**
 * Everything the atoms need, built once per surface.
 *
 * A plain object rather than a context: both bars are one component deep, and a
 * provider would put a re-render boundary between the chrome and the store
 * subscriptions the atoms already hold individually.
 */
function useActionCtx(
  slug: string,
  base: string,
  chrome: Chrome,
  store?: StorefrontStore,
): MobileActionCtx {
  const pathname = useStorePathname();
  const menuOpen = useMobileNav((s) => s.menuOpen);
  const openMenu = useMobileNav((s) => s.openMenu);
  const openSearch = useMobileNav((s) => s.openSearch);

  const isActive = (id: MobileActionId) => {
    switch (id) {
      case "home":
        return pathname === base || pathname === `${base}/` || pathname === "/";
      case "menu":
        return menuOpen || pathname.includes("/products");
      case "cart":
        return pathname.includes("/cart");
      case "account":
        return pathname.includes("/account");
      case "track":
        return pathname.includes("/t");
      default:
        return false;
    }
  };

  return {
    base,
    slug,
    chrome,
    openMenu,
    openSearch,
    // The merchant's published number. `call` renders nothing without one —
    // see `needs: "phone"` in the action registry.
    phone: store?.contact?.phone?.trim() ?? "",
    isActive,
  };
}

const Slot = ({ ids, ctx }: { ids: MobileActionId[]; ctx: MobileActionCtx }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    {ids.map((id) => (
      <MobileAction key={id} id={id} ctx={ctx} mode="bar" />
    ))}
  </div>
);

/* ================================== bar =================================== */

export function MobileBar({
  slug,
  base,
  store,
  categories,
  barRef,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
  /**
   * Measured by `useHeaderHeight`, and it must land on the BAR — not on a
   * wrapper around it.
   *
   * `position: sticky` is confined to its parent's box, so a wrapper that
   * exactly fits the bar gives it zero travel and it scrolls away like a static
   * element: sticky silently does nothing on four of the five templates. The ref
   * comes down here so the header has no reason to wrap it.
   */
  barRef?: RefObject<HTMLDivElement | null>;
}) {
  const chrome = useMobileChrome(store);
  const logo = useMobileBrandLogo(store);
  const ctx = useActionCtx(slug, base, chrome, store);
  const name = store?.name ?? "Store";
  /* The utility bar renders directly above this one, so whatever it carries is
     dropped from these slots rather than drawn twice. */
  const utilityBar = useResolvedUtilityBar(store);
  const needs = headerNeeds(utilityBar, "mobile");
  const left = keptSlot(chrome.left, needs);
  const right = keptSlot(chrome.right, needs);

  const brand = (
    <Link
      href={storeHref(base)}
      style={{ display: "flex", alignItems: "center", minWidth: 0 }}
    >
      <Brand
        name={name}
        logo={logo}
        markSize={chrome.logoHeight}
        nameSize={Math.round(chrome.logoHeight * 0.47)}
      />
    </Link>
  );

  return (
    <div ref={barRef} className="sf-mobile-only" style={barStyle(chrome.sticky)}>
      {chrome.brand === "center" ? (
        /* A three-column grid, NOT flex with a spacer. The centre column is the
           only one that must land on the page's midline, and with flex it lands
           on the midline of whatever the two slots left over — so a bar with one
           icon on the left and two on the right drew a logo visibly off-centre.
           `1fr auto 1fr` centres it against the bar regardless of the slots,
           which is the entire point of choosing this arrangement. */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Slot ids={left} ctx={ctx} />
          <div style={{ justifySelf: "center", minWidth: 0 }}>{brand}</div>
          <div style={{ justifySelf: "end" }}>
            <Slot ids={right} ctx={ctx} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Slot ids={left} ctx={ctx} />
          {brand}
          {chrome.searchInline ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <SearchField />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <Slot ids={right} ctx={ctx} />
        </div>
      )}

      {chrome.row === "search" ? (
        <div style={{ marginTop: 10 }}>
          <SearchField />
        </div>
      ) : chrome.row === "chips" ? (
        <CategoryChips base={base} categories={categories} />
      ) : null}
    </div>
  );
}

/** The full-width search trigger. Opens the one takeover in `MobileOverlays`. */
function SearchField() {
  const { t } = useStorefrontUI();
  const openSearch = useMobileNav((s) => s.openSearch);
  return (
    <button
      type="button"
      onClick={openSearch}
      style={{
        width: "100%",
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "9px 12px",
        color: "var(--muted)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <Icon name="search" size={18} />
      <span
        style={{
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {t.searchPh}
      </span>
    </button>
  );
}

/**
 * The departments as a scrolling row of text chips.
 *
 * Text, not the homepage's photo tiles: this is chrome on every page, so it has
 * to stay one 40px line whatever the merchant's category artwork looks like.
 * Renders nothing for a shop with no categories rather than an empty track.
 */
function CategoryChips({
  base,
  categories,
}: {
  base: string;
  categories: CatalogCategory[];
}) {
  const { t } = useStorefrontUI();
  if (!categories.length) return null;
  return (
    <div className="sf-mchips" style={{ marginTop: 8 }}>
      <Link href={storeHref(base, "/products")} className="sf-mchip">
        {t.allProducts}
      </Link>
      {categories.map((c) => (
        <Link key={c._id} href={collectionHref(base, c)} className="sf-mchip">
          {c.name}
        </Link>
      ))}
    </div>
  );
}

/* ================================== tabs ================================== */

const tabBar: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  display: "flex",
  background: "var(--card)",
  borderTop: "1px solid var(--border)",
  paddingBottom: "env(safe-area-inset-bottom)",
  boxShadow: "0 -6px 20px -16px rgba(0,0,0,0.35)",
};

export function MobileTabs({
  slug,
  base,
  store,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
}) {
  const chrome = useMobileChrome(store);
  const { t } = useStorefrontUI();
  const ctx = useActionCtx(slug, base, chrome, store);

  // No tabs is a real answer, not an empty bar: four of the five templates have
  // none. `StoreShell` stops reserving the 56px in the same breath — see the
  // `data-sf-tabs` note there.
  if (!chrome.tabs.length) return null;

  return (
    <nav className="sf-mobile-only" style={tabBar} aria-label={t.menu}>
      {chrome.tabs.map((id) => (
        <MobileAction key={id} id={id} ctx={ctx} mode="tab" />
      ))}
    </nav>
  );
}

/* ================================ overlays ================================ */

/**
 * The menu panel and the search takeover — **mounted once, by the shell**.
 *
 * Not inside `MobileBar`: the Menu TAB opens the same panel, and a copy per
 * surface is two drawers racing one scroll lock. Both are driven by
 * `useMobileNav`, so whichever control opened it, this is what draws it.
 */
export function MobileOverlays({
  base,
  store,
  categories,
}: {
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
}) {
  const chrome = useMobileChrome(store);
  /* The drawer is the LAST fallback for language and theme, so it has to know
     about the utility bar too — otherwise a phone bar carrying them still gets
     a second copy listed inside the menu. */
  const utilityBar = useResolvedUtilityBar(store);
  const utilityNeeds = headerNeeds(utilityBar, "mobile");
  const menuOpen = useMobileNav((s) => s.menuOpen);
  const closeMenu = useMobileNav((s) => s.closeMenu);
  const searchOpen = useMobileNav((s) => s.searchOpen);
  const closeSearch = useMobileNav((s) => s.closeSearch);
  /* Memoized because the sheet declares it as a dependency of the `close` it
     builds, which in turn gates the effect holding its popstate and keydown
     listeners. An inline arrow here — which this was — is a new identity every
     render, so those listeners were torn down and re-added on every render of
     the chrome, including while the sheet was open. `closeSearch` is a store
     action and is stable, so this callback never changes. */
  const onSearchOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeSearch();
    },
    [closeSearch],
  );

  return (
    <>
      <MobileMenuPanel
        open={menuOpen}
        onClose={closeMenu}
        chrome={chrome}
        utilityNeeds={utilityNeeds}
        base={base}
        categories={categories}
        menu={store?.nav?.header ?? []}
      />
      <HeaderSearchMobile
        categories={categories}
        open={searchOpen}
        onOpenChange={onSearchOpenChange}
      />
    </>
  );
}

/** Whether this store's chrome reserves room for a bottom bar — see `StoreShell`. */
export function useHasMobileTabs(store?: StorefrontStore): boolean {
  return useMobileChrome(store).tabs.length > 0;
}
