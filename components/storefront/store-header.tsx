"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  StoreMenuItem,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartNav } from "@/services/storefront/use-cart-nav";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { Icon } from "@/components/storefront/sf-icons";
import { HeaderNav, menuHref } from "@/components/storefront/header-nav";
import { Brand } from "@/components/storefront/logo-mark";

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
  tagline: string;
  phone: string;
  t: T;
  theme: "light" | "dark";
  lang: "en" | "bn";
  toggleTheme: () => void;
  toggleLang: () => void;
  shopperName?: string;
  cartCount: number;
  goCart: () => void;
  goSearch: () => void;
  headerMenu: StoreMenuItem[];
  cats: CatalogCategory[];
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
  const { cartCount, goCart, goSearch } = useCartNav(slug, base);
  const shopper = useShopperStore((s) => s.shopper);
  const previewHeader = useSfPreview((s) => s.header);

  const ctx: HeaderCtx = {
    base,
    name: store?.name ?? "Store",
    logo: store?.logo?.url || store?.logo?.thumbnailUrl,
    tagline: "EVERYDAY ESSENTIALS",
    phone: store?.contact?.phone ?? "",
    t,
    theme,
    lang,
    toggleTheme,
    toggleLang,
    shopperName: shopper?.name,
    cartCount,
    goCart,
    goSearch,
    headerMenu: store?.nav?.header ?? [],
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
  const { base, name, logo, t, theme, lang, toggleTheme, toggleLang, goSearch } = ctx;
  // Cart + account live in the bottom nav on mobile, so the top bar keeps just
  // the logo, locale/theme toggles and the search field.
  return (
    <div className="sf-mobile-only" style={{ ...headerBar, padding: "14px 14px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brand name={name} logo={logo} markSize={29} nameSize={15.5} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span onClick={toggleLang} role="button" tabIndex={0} style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, cursor: "pointer" }}>
            {lang === "en" ? "বাংলা" : "EN"}
          </span>
          <span onClick={toggleTheme} role="button" tabIndex={0} style={{ cursor: "pointer", display: "flex", color: "var(--text)" }}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </span>
        </div>
      </div>
      <button type="button" onClick={goSearch} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--faint)", cursor: "pointer" }}>
        <Icon name="search" size={18} />
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{t.searchPh}</span>
      </button>
    </div>
  );
}

/* --------------------------- desktop variants ----------------------------- */

function ClassicDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo, tagline } = ctx;
  return (
    <>
      <UtilityBar ctx={ctx} />
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "13px var(--pad)", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <Brand name={name} logo={logo} markSize={38} nameSize={18} tagline={tagline} />
        </Link>
        <SearchBar ctx={ctx} />
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
  const { base, name, logo, headerMenu, cats } = ctx;
  const links =
    headerMenu.length > 0
      ? headerMenu.map((m) => ({ key: m.label, label: m.label, href: menuHref(m, base, cats) }))
      : cats.map((c) => ({ key: c._id, label: c.name, href: storeHref(base, `/products?categoryId=${c._id}`) }));
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
        <SearchIconBtn ctx={ctx} />
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
          <SearchIconBtn ctx={ctx} />
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
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icon name="phone" size={15} /> {phone || "16263"} · {t.deliverDhaka}
      </span>
      <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link href={storeHref(base, "/account")} style={{ color: "inherit" }}>{t.trackOrder}</Link>
        <span style={{ cursor: "pointer" }}>{t.help}</span>
        <LangBtn ctx={ctx} />
        <ThemeBtn ctx={ctx} />
      </span>
    </div>
  );
}

function LangBtn({ ctx }: { ctx: HeaderCtx }) {
  return (
    <span onClick={ctx.toggleLang} role="button" tabIndex={0} style={{ cursor: "pointer", fontWeight: 600, color: "var(--text)" }}>
      {ctx.lang === "en" ? "বাংলা" : "English"}
    </span>
  );
}

function ThemeBtn({ ctx }: { ctx: HeaderCtx }) {
  const { theme, toggleTheme, t } = ctx;
  return (
    <span onClick={toggleTheme} role="button" tabIndex={0} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      {theme === "dark" ? t.lightMode : t.darkMode}
    </span>
  );
}

function SearchBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    <button type="button" onClick={ctx.goSearch} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--faint)", cursor: "pointer", minWidth: 200 }}>
      <Icon name="search" size={18} />
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{ctx.t.searchPh}</span>
    </button>
  );
}

function SearchIconBtn({ ctx }: { ctx: HeaderCtx }) {
  return (
    <button type="button" onClick={ctx.goSearch} aria-label={ctx.t.searchPh} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", color: "var(--text)" }}>
      <Icon name="search" size={20} />
    </button>
  );
}

function AccountLink({ ctx, withLabel }: { ctx: HeaderCtx; withLabel?: boolean }) {
  const { base, shopperName, t } = ctx;
  return (
    <Link href={storeHref(base, "/account")} aria-label={shopperName ? t.myAccount : t.signIn} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
      <Icon name="user" size={18} />
      {withLabel ? <span>{shopperName ? shopperName.split(" ")[0] : t.signIn}</span> : null}
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
  const { base, headerMenu, cats } = ctx;
  if (headerMenu.length > 0) {
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
        fontSize: 10,
        fontWeight: 700,
        minWidth: compact ? 17 : 18,
        height: compact ? 17 : 18,
        borderRadius: 9,
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
