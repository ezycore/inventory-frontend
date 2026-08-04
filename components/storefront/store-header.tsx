"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  HeaderMenuSource,
  StoreMenuItem,
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
import {
  HeaderNav,
  expandHeaderMenu,
  menuHref,
} from "@/components/storefront/header-nav";
import { Brand } from "@/components/storefront/logo-mark";
import {
  HeaderSearchBar,
  HeaderSearchIcon,
  HeaderSearchMobile,
} from "@/components/storefront/header-search";

const HEADER_VARIANTS: readonly string[] = ["classic", "minimal", "centered"];

const headerBar: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "var(--header)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: "1px solid var(--border)",
};

type T = ReturnType<typeof useStorefrontUI>["t"];

interface HeaderCtx {
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
  goCart: () => void;
  headerMenu: StoreMenuItem[];
  /** Where the top links come from — owner-chosen, never inferred from length. */
  menuSource: HeaderMenuSource;
  cats: CatalogCategory[];
}

/** Top links for the compact header variants, per the resolved menu source. */
function headerLinks(ctx: HeaderCtx): { key: string; label: string; href: string }[] {
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
        href: storeHref(base, `/products?categoryId=${c._id}`),
      }));
}

/**
 * Storefront header — renders one of three admin-selectable desktop variants
 * (Classic / Minimal / Centered) from `templates.header`; the mobile header is
 * shared. Reads the live preview override first so switching repaints instantly.
 */
export function StoreHeader({
  slug,
  base,
  store,
  categories,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
}) {
  const { t, theme, lang, toggleTheme, toggleLang } = useStorefrontUI();
  const { cartCount, goCart } = useCartNav(slug);
  const shopper = useShopperStore((s) => s.shopper);
  const hydrated = useHydrated();
  const previewHeader = useSfPreview((s) => s.header);
  const previewMenuSrc = useSfPreview((s) => s.headerMenuSrc);
  const previewNavHeader = useSfPreview((s) => s.navHeader);
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
    goCart,
    headerMenu,
    menuSource,
    cats: categories ?? [],
  };

  const variant: StoreTemplates["header"] = HEADER_VARIANTS.includes(
    previewHeader ?? "",
  )
    ? (previewHeader as StoreTemplates["header"])
    : resolveTemplates(store).header;

  return (
    <>
      <MobileHeader ctx={ctx} />
      <div className="sf-desktop-only" style={headerBar}>
        {variant === "minimal" ? (
          <MinimalDesktop ctx={ctx} />
        ) : variant === "centered" ? (
          <CenteredDesktop ctx={ctx} />
        ) : (
          <ClassicDesktop ctx={ctx} />
        )}
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

/* --------------------------- desktop variants ----------------------------- */

function ClassicDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  return (
    <>
      <UtilityBar ctx={ctx} />
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "13px var(--pad)", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <Brand name={name} logo={logo} markSize={38} nameSize={18} />
        </Link>
        <HeaderSearchBar categories={ctx.cats} />
        <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "none" }}>
          <AccountLink ctx={ctx} withLabel />
          <CartButton ctx={ctx} withLabel />
        </div>
      </div>
      <CategoryRow ctx={ctx} />
    </>
  );
}

function MinimalDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  const links = headerLinks(ctx);
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "12px var(--pad)", display: "flex", alignItems: "center", gap: 24 }}>
      <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
        <Brand name={name} logo={logo} markSize={32} nameSize={17} />
      </Link>
      <nav style={{ flex: 1, display: "flex", gap: 20, overflowX: "auto", justifyContent: "center" }}>
        {links.map((l) => (
          <Link key={l.key} href={l.href} style={{ fontSize: 13.5, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
        <HeaderSearchIcon categories={ctx.cats} />
        <AccountLink ctx={ctx} />
        <CartButton ctx={ctx} />
      </div>
    </div>
  );
}

function CenteredDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  return (
    <>
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "13px var(--pad)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--muted)" }}>
          <LangBtn ctx={ctx} />
          <ThemeBtn ctx={ctx} />
        </div>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "center" }}>
          <Brand name={name} logo={logo} markSize={34} nameSize={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18, justifySelf: "end" }}>
          <HeaderSearchIcon categories={ctx.cats} />
          <AccountLink ctx={ctx} />
          <CartButton ctx={ctx} />
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <CategoryRow ctx={ctx} center />
      </div>
    </>
  );
}

/* ------------------------------ shared pieces ----------------------------- */

function UtilityBar({ ctx }: { ctx: HeaderCtx }) {
  const { base, phone, t } = ctx;
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "6px var(--pad)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
      {/* Merchant's real phone only — never a placeholder number. */}
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {phone ? (
          <>
            <Icon name="phone" size={15} /> {phone}
          </>
        ) : null}
      </span>
      <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link href={storeHref(base, "/account")} style={{ color: "inherit" }}>{t.trackOrder}</Link>
        <LangBtn ctx={ctx} />
        <ThemeBtn ctx={ctx} />
      </span>
    </div>
  );
}

/** Reset for icon/text buttons in the header bars (real buttons for keyboard). */
const bareBtn: CSSProperties = {
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
const tapPad: CSSProperties = { padding: 12, margin: -12 };

function LangBtn({ ctx }: { ctx: HeaderCtx }) {
  return (
    <button type="button" onClick={ctx.toggleLang} style={{ ...bareBtn, fontWeight: 600, color: "var(--text)" }}>
      {ctx.lang === "en" ? "বাংলা" : "English"}
    </button>
  );
}

function ThemeBtn({ ctx }: { ctx: HeaderCtx }) {
  const { theme, toggleTheme, t } = ctx;
  return (
    <button type="button" onClick={toggleTheme} style={{ ...bareBtn, display: "flex", alignItems: "center", gap: 5, color: "inherit" }}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      {theme === "dark" ? t.lightMode : t.darkMode}
    </button>
  );
}

function AccountLink({ ctx, withLabel }: { ctx: HeaderCtx; withLabel?: boolean }) {
  const { base, shopperName, sessionKnown, t } = ctx;
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

function CartButton({ ctx, withLabel }: { ctx: HeaderCtx; withLabel?: boolean }) {
  const { goCart, cartCount, t } = ctx;
  return (
    <button type="button" onClick={goCart} aria-label={t.cart} style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}>
      <Icon name="cart" size={22} />
      {withLabel ? <span style={{ fontSize: 13, fontWeight: 600 }}>{t.cart}</span> : null}
      {cartCount > 0 ? <CartBadge count={cartCount} compact={!withLabel} /> : null}
    </button>
  );
}

function CategoryRow({ ctx, center }: { ctx: HeaderCtx; center?: boolean }) {
  const { base, headerMenu, menuSource, cats } = ctx;
  if (menuSource === "custom") {
    if (headerMenu.length === 0) return null;
    return <HeaderNav base={base} menu={headerMenu} categories={cats} center={center} />;
  }
  if (cats.length === 0) return null;
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 var(--pad) 11px", display: "flex", gap: 22, overflowX: "auto", justifyContent: center ? "center" : "flex-start" }}>
      {cats.map((c) => (
        <Link key={c._id} href={storeHref(base, `/products?categoryId=${c._id}`)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {c.name}
        </Link>
      ))}
    </div>
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
