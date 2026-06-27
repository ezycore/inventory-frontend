"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, useStoreCategories } from "@/services/storefront/hooks";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { StoreContextProvider } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { OwnerAdminBar } from "@/components/storefront/owner-admin-bar";
import { CartDrawer } from "@/components/storefront/cart-drawer";

const headerBar: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "var(--header)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: "1px solid var(--border)",
};

function LogoMark({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? 9 : 7,
        background: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--on-primary)",
        fontWeight: 700,
        fontSize: size > 32 ? 18 : 14,
        flex: "none",
      }}
    >
      {(name || "S").charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Storefront chrome — desktop + mobile header (utility bar, search, account,
 * cart, category nav), theme/language toggles, breadcrumb, footer, the cart
 * slide-over and the owner admin bar. Rendered by the server `shop/layout.tsx`,
 * which passes `slug`/`base`; everything reads them via context.
 */
export function StoreShell({
  slug,
  base,
  children,
}: {
  slug: string;
  base: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, theme, lang, toggleTheme, toggleLang } = useStorefrontUI();

  const { data: store, isError } = useStore(slug);
  const { data: categories } = useStoreCategories(slug);
  const cartCount = useCartStore((s) =>
    s.storeSlug === slug ? s.items.reduce((n, i) => n + i.quantity, 0) : 0,
  );
  const openCart = useCartUI((s) => s.openCart);
  const shopper = useShopperStore((s) => s.shopper);

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

  const name = store?.name ?? "Store";
  const brandColor = store?.theme?.brandColor;
  // The merchant's brand colour overrides --primary (light + dark) for the shell.
  const shellVars = (brandColor
    ? { "--primary": brandColor, "--primary-hover": brandColor }
    : {}) as CSSProperties;

  const tagline = "EVERYDAY ESSENTIALS";
  const phone = store?.contact?.phone ?? "";
  const announcement = store?.nav?.announcement;
  const footerGroups = store?.nav?.footer ?? [];
  const cats = categories ?? [];

  const goSearch = () => router.push(storeHref(base, "/search"));

  const onHome = pathname === base || pathname === `${base}/` || pathname === "/";
  const crumb = !onHome ? crumbLabel(pathname, t) : "";

  const themeBtn = (
    <span
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      {theme === "dark" ? t.lightMode : t.darkMode}
    </span>
  );
  const langBtn = (
    <span
      onClick={toggleLang}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer", fontWeight: 600, color: "var(--text)" }}
    >
      {lang === "en" ? "বাংলা" : "English"}
    </span>
  );

  return (
    <StoreContextProvider slug={slug} base={base}>
      <div
        style={{
          ...shellVars,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--page)",
          color: "var(--text)",
        }}
      >
        {/* Announcement */}
        {announcement?.enabled && announcement.text ? (
          <div
            style={{
              background: announcement.bgColor || "var(--primary)",
              color: "var(--on-primary)",
              textAlign: "center",
              fontSize: 12.5,
              fontWeight: 500,
              padding: "7px 16px",
            }}
          >
            {announcement.link ? (
              <Link href={announcement.link} style={{ color: "inherit" }}>
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </div>
        ) : null}

        {/* ===== Mobile header ===== */}
        <div className="sf-mobile-only" style={{ ...headerBar, padding: "14px 14px 10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Link
              href={storeHref(base)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <LogoMark name={name} size={29} />
              <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.02em" }}>
                {name}
              </span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span onClick={toggleLang} role="button" tabIndex={0} style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, cursor: "pointer" }}>
                {t.langTag}
              </span>
              <span onClick={toggleTheme} role="button" tabIndex={0} style={{ cursor: "pointer", display: "flex", color: "var(--text)" }}>
                <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
              </span>
              <button
                type="button"
                onClick={openCart}
                aria-label={t.cart}
                style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", display: "flex" }}
              >
                <Icon name="cart" size={22} />
                {cartCount > 0 ? <CartBadge count={cartCount} compact /> : null}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={goSearch}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "9px 12px",
              color: "var(--faint)",
              cursor: "pointer",
            }}
          >
            <Icon name="search" size={18} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{t.searchPh}</span>
          </button>
        </div>

        {/* ===== Desktop header ===== */}
        <div className="sf-desktop-only" style={headerBar}>
          <div
            className="sf-desktop-only"
            style={{
              maxWidth: "var(--maxw)",
              margin: "0 auto",
              padding: "6px var(--pad)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--muted)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="phone" size={15} /> {phone || "16263"} · {t.deliverDhaka}
            </span>
            <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Link href={storeHref(base, "/account")} style={{ color: "inherit" }}>
                {t.trackOrder}
              </Link>
              <span style={{ cursor: "pointer" }}>{t.help}</span>
              {langBtn}
              {themeBtn}
            </span>
          </div>
          <div
            style={{
              maxWidth: "var(--maxw)",
              margin: "0 auto",
              padding: "13px var(--pad)",
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={storeHref(base)}
              style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}
            >
              <LogoMark name={name} size={38} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {name}
                </div>
                <div style={{ fontSize: 10, color: "var(--faint)", letterSpacing: "0.08em", marginTop: 2 }}>
                  {tagline}
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={goSearch}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--faint)",
                cursor: "pointer",
                minWidth: 200,
              }}
            >
              <Icon name="search" size={18} />
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{t.searchPh}</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "none" }}>
              <Link
                href={storeHref(base, "/account")}
                style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}
              >
                {shopper ? shopper.name.split(" ")[0] : t.account}
              </Link>
              <button
                type="button"
                onClick={openCart}
                style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}
              >
                <Icon name="cart" size={22} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.cart}</span>
                {cartCount > 0 ? <CartBadge count={cartCount} /> : null}
              </button>
            </div>
          </div>
          {cats.length > 0 ? (
            <div
              style={{
                maxWidth: "var(--maxw)",
                margin: "0 auto",
                padding: "0 var(--pad) 11px",
                display: "flex",
                gap: 22,
                overflowX: "auto",
              }}
            >
              {cats.map((c) => (
                <Link
                  key={c._id}
                  href={storeHref(base, `/products?categoryId=${c._id}`)}
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Breadcrumb */}
        {crumb ? (
          <div
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

        {/* Footer */}
        <footer style={{ background: "var(--card)", borderTop: "1px solid var(--border)", marginTop: 20 }}>
          <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "36px var(--pad) 28px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "var(--footcols)",
                gap: 28,
                marginBottom: 28,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <LogoMark name={name} size={31} />
                  <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>{name}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
                  {store?.theme?.footerText ?? t.storeInfo}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {footerGroups.length > 0
                  ? footerGroups.map((g) => (
                      <div key={g.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {g.title}
                        </div>
                        {g.links.map((lk) => (
                          <a key={lk.label} href={lk.url || "#"} style={{ fontSize: 13, color: "var(--muted)" }}>
                            {lk.label}
                          </a>
                        ))}
                      </div>
                    ))
                  : t.links.map((lk) => (
                      <span key={lk} style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                        {lk}
                      </span>
                    ))}
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 11 }}>
                  {t.weAccept}
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {(store?.allowedPaymentMethods ?? ["cod", "bank"]).map((m) => (
                    <span
                      key={m}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 7 }}
                    >
                      {m === "cod" ? t.cod : t.bankTransfer}
                    </span>
                  ))}
                </div>
                {phone ? (
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--muted)" }}>
                    <Icon name="phone" size={15} /> {t.callUs} {phone}
                  </div>
                ) : null}
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
                fontSize: 12,
                color: "var(--faint)",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span>
                © {new Date().getFullYear()} {name} · {t.poweredBy} EzyCore
              </span>
              <span>Bangladesh · {store?.currency ?? "BDT"}</span>
            </div>
          </div>
        </footer>

        <CartDrawer />
        <OwnerAdminBar />
      </div>
    </StoreContextProvider>
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

function crumbLabel(pathname: string, t: Dict): string {
  if (/\/products\/[^/]+$/.test(pathname)) return t.navProduct;
  if (/\/products(\?|$)/.test(pathname) || /\/products$/.test(pathname)) return t.navShop;
  if (pathname.includes("/search")) return t.navSearch;
  if (pathname.includes("/cart")) return t.navCart;
  if (pathname.includes("/checkout")) return t.navCheckout;
  if (pathname.includes("/account")) return t.navAccount;
  return "";
}
