"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  HeaderMenuSource,
  StoreMenuItem,
} from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { ResolvedUtilityBar } from "@/lib/storefront-utility-bar";
import { Icon } from "@/components/storefront/sf-icons";
import {
  HeaderNav,
  expandHeaderMenu,
  menuHref,
} from "@/components/storefront/header-nav";

/**
 * The header's shared vocabulary — the context every variant reads and the
 * pieces they compose from.
 *
 * Split out of `store-header.tsx` when the fourth and fifth desktop anatomies
 * arrived (2026-08-12): five variants plus seven shared pieces in one file was
 * past the repo's ~400-line smell, and the variants are the half that keeps
 * growing. One direction of import only — variants import from here, never back.
 */

type T = ReturnType<typeof useStorefrontUI>["t"];

export interface HeaderCtx {
  base: string;
  name: string;
  logo?: string;
  phone: string;
  t: T;
  theme: "light" | "dark";
  lang: "en" | "bn";
  toggleTheme: () => void;
  toggleLang: () => void;
  shopperName?: string;
  /** False until the persisted shopper store hydrates (guest vs member unknown). */
  sessionKnown: boolean;
  cartCount: number;
  /** Basket subtotal — only `search-first` draws it. See `useCartNav`. */
  cartSubtotal: number;
  /** Store currency, for the subtotal above. */
  currency?: string;
  goCart: () => void;
  headerMenu: StoreMenuItem[];
  /** Where the top links come from — owner-chosen, never inferred from length. */
  menuSource: HeaderMenuSource;
  cats: CatalogCategory[];
  /** The `rail` shell lists departments itself; suppress the header row. */
  hideCategoryRow?: boolean;
  /**
   * The §6 page controls, resolved once by `StoreHeader` (`storePages`).
   *
   * Required, not optional: an anatomy that forgot to read one would draw a
   * control for a page this shop does not serve, and `boolean | undefined`
   * would let it compile. The pieces below gate themselves on these, so a
   * variant only handles the case where a hole in the bar needs closing up.
   */
  showSearch: boolean;
  showAccount: boolean;
  /**
   * Does this anatomy still owe the shopper a theme / language control?
   *
   * False only while the utility bar is on THIS breakpoint and carrying that
   * item itself — so the two never render side by side, and no anatomy can end
   * up without one. Asked per item, not per template, for the same reason
   * `MobileMenuPanel` asks `chromeHas(chrome, "theme")`: the merchant turns the
   * four utility items on and off independently, so "the bar is showing" says
   * nothing about whether the theme switch in particular survived.
   *
   * Theme is the load-bearing one — it is persisted to `localStorage` and
   * re-applied before paint, so an anatomy with no way back STRANDS a shopper
   * in dark mode on every future visit rather than merely hiding a preference.
   */
  needsTheme: boolean;
  needsLang: boolean;
  /**
   * The merchant first promise ("Same-day delivery"), shown as a chip by the
   * search-first bar. Sourced from trustBadges rather than its own field: the
   * owner already writes those, so there is no new empty state to design.
   */
  deliveryPromise?: string;
}

export const headerBar: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "var(--header)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: "1px solid var(--border)",
};

/** Reset for icon/text buttons in the header bars (real buttons for keyboard). */
export const bareBtn: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: "inherit",
  fontSize: "inherit",
  cursor: "pointer",
};

/** Grows a `bareBtn` icon/label to a comfortable touch target while leaving it
 *  optically where it sits — the negative margin cancels the padding, so
 *  surrounding gaps and alignment are unchanged. Mobile header only; the
 *  desktop bars are pointer-driven and densely packed by design. */
export const tapPad: CSSProperties = { padding: 12, margin: -12 };

/** Top links for the compact header variants, per the resolved menu source. */
export function headerLinks(ctx: HeaderCtx): { key: string; label: string; href: string }[] {
  const { base, headerMenu, menuSource, cats } = ctx;
  return menuSource === "custom"
    ? headerMenu.map((m) => ({
        key: m.label,
        label: m.label,
        href: menuHref(m, base, cats),
      }))
    : cats.map((c) => ({
        key: c._id,
        label: c.name,
        href: collectionHref(base, c),
      }));
}

export function UtilityBar({
  ctx,
  config,
  className,
}: {
  ctx: HeaderCtx;
  config: ResolvedUtilityBar;
  className?: string;
}) {
  const { base, phone, t } = ctx;
  const hasPhone = config.showPhone && !!phone;
  if (
    !hasPhone &&
    !config.showTrackOrder &&
    !config.showLanguage &&
    !config.showTheme
  ) return null;
  return (
    <div className={className} style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "6px var(--pad)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
      {/* Merchant's real phone only — never a placeholder number. */}
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {hasPhone ? (
          <>
            <Icon name="phone" size={15} /> {phone}
          </>
        ) : null}
      </span>
      <span style={{ display: "flex", gap: 16, alignItems: "center", marginInlineStart: "auto" }}>
        {/* "Track order" goes to the account area, which is where a signed-in
            shopper's orders live — but that area is the merchant's to switch
            off, and tracking is NOT. With accounts off it points at the
            standalone lookup instead, so the link keeps doing what it says. */}
        {config.showTrackOrder ? (
          <Link
            href={storeHref(base, ctx.showAccount ? "/account" : "/orders/track")}
            style={{ color: "inherit" }}
          >
            {config.trackOrderLabel || t.trackOrder}
          </Link>
        ) : null}
        {config.showLanguage ? <LangBtn ctx={ctx} /> : null}
        {config.showTheme ? <ThemeBtn ctx={ctx} /> : null}
      </span>
    </div>
  );
}

export function LangBtn({ ctx }: { ctx: HeaderCtx }) {
  return (
    <button type="button" onClick={ctx.toggleLang} style={{ ...bareBtn, fontWeight: 600, color: "var(--text)" }}>
      {ctx.lang === "en" ? "বাংলা" : "English"}
    </button>
  );
}

/**
 * The light/dark switch shared by header anatomies and the utility bar.
 *
 * The choice is persisted to `localStorage` and re-applied before paint by the
 * script in the storefront layout. Non-Classic desktop anatomies retain their
 * own control; Classic receives it through the independently configurable
 * utility bar unless the merchant deliberately turns that item off.
 *
 * `compact` is for the icon rows that have no room for a word; it is a prop
 * rather than a second component so the two can never drift on what they toggle
 * or how they label themselves to a screen reader.
 */
export function ThemeBtn({ ctx, compact }: { ctx: HeaderCtx; compact?: boolean }) {
  const { theme, toggleTheme, t } = ctx;
  const label = theme === "dark" ? t.lightMode : t.darkMode;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={compact ? label : undefined}
      style={{
        ...bareBtn,
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: compact ? "var(--text)" : "inherit",
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={compact ? 18 : 14} />
      {compact ? null : label}
    </button>
  );
}

export function AccountLink({ ctx, withLabel }: { ctx: HeaderCtx; withLabel?: boolean }) {
  const { base, shopperName, sessionKnown, t } = ctx;
  // Gated here rather than at six call sites: with accounts off there is no
  // account area to link to, and a seventh anatomy must not be able to forget
  // it. Each variant lays this out as a plain flex child, so its absence closes
  // up on its own — only the search wrappers needed a gate of their own.
  if (!ctx.showAccount) return null;
  // Until the persisted session hydrates we don't know guest vs member — show a
  // shimmer chip instead of flashing "Sign in" at signed-in shoppers on reload.
  const label = !sessionKnown ? (
    <span className="sf-skeleton" aria-hidden style={{ width: 40, height: 11, borderRadius: 6 }} />
  ) : (
    <span>{shopperName ? shopperName.split(" ")[0] : t.signIn}</span>
  );
  return (
    <Link href={storeHref(base, "/account")} aria-label={t.myAccount} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
      <Icon name="user" size={18} />
      {withLabel ? label : null}
    </Link>
  );
}

export function CartButton({ ctx, withLabel }: { ctx: HeaderCtx; withLabel?: boolean }) {
  const { goCart, cartCount, t } = ctx;
  return (
    <button type="button" onClick={goCart} aria-label={t.cart} style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}>
      <Icon name="cart" size={22} />
      {withLabel ? <span style={{ fontSize: 13, fontWeight: 600 }}>{t.cart}</span> : null}
      {cartCount > 0 ? <CartBadge count={cartCount} compact={!withLabel} /> : null}
    </button>
  );
}

/**
 * The whole category tree as a menu: one `collections` block, which
 * `expandHeaderMenu` turns into a top-level link per parent carrying its
 * sub-categories as dropdown children.
 */
const COLLECTIONS_MENU: StoreMenuItem[] = [
  { label: "", type: "collections", value: "" },
];

export function CategoryRow({ ctx, center }: { ctx: HeaderCtx; center?: boolean }) {
  const { base, headerMenu, menuSource, cats } = ctx;
  // The rail shell already lists every department down the left of the page;
  // drawing the same list again here is the duplication that has bitten this
  // storefront twice already (the trust badges, and the hero photograph).
  if (ctx.hideCategoryRow) return null;
  if (menuSource === "custom") {
    if (headerMenu.length === 0) return null;
    return <HeaderNav base={base} menu={headerMenu} categories={cats} center={center} />;
  }
  if (cats.length === 0) return null;
  // Collections mode goes through the SAME component as a custom menu, so a
  // sub-category gets the same hover/focus dropdown under its parent. This was a
  // bare link row until now, which meant the default store — the one whose owner
  // never opened Customize — surfaced no sub-categories in the header at all.
  //
  // It also has to stop being an `overflowX: auto` strip: a scroll container
  // establishes a clipping box on BOTH axes, so the absolutely-positioned
  // dropdown panel would be cut off at the row's bottom edge. `HeaderNav` wraps
  // instead, which is what lets the panel escape.
  return (
    <HeaderNav
      base={base}
      menu={expandHeaderMenu(COLLECTIONS_MENU, cats)}
      categories={cats}
      center={center}
    />
  );
}

function CartBadge({ count, compact }: { count: number; compact?: boolean }) {
  return (
    <span
      className="sf-mono"
      style={{
        position: "absolute",
        top: compact ? -7 : -8,
        right: compact ? -9 : undefined,
        left: compact ? undefined : 14,
        background: "var(--primary)",
        color: "var(--on-primary)",
        fontSize: 11,
        fontWeight: 700,
        minWidth: compact ? 18 : 19,
        height: compact ? 18 : 19,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
      }}
    >
      {count}
    </span>
  );
}
