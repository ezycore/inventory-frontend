"use client";
// coding-standard: maintained

import { Fragment, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import type {
  CatalogCategory,
  StoreMenuItem,
  StorefrontStore,
} from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartNav } from "@/services/storefront/use-cart-nav";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { menuHref } from "@/components/storefront/header-nav";

type T = ReturnType<typeof useStorefrontUI>["t"];

const bar: CSSProperties = {
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

/**
 * Mobile-only bottom tab bar — the primary way to move around the storefront on
 * a phone (the mobile header only carries the logo, search and locale toggles).
 * Home / Menu / Cart / Account, where "Menu" opens a slide-up sheet listing the
 * store's categories and any admin-configured header menu links (both otherwise
 * unreachable on mobile). Hidden ≥680px via `sf-mobile-only`.
 */
export function StoreBottomNav({
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
  const pathname = usePathname();
  const { t } = useStorefrontUI();
  const { cartCount, goCart } = useCartNav(slug);
  const [menuOpen, setMenuOpen] = useState(false);

  const onHome =
    pathname === base || pathname === `${base}/` || pathname === "/";
  const onProducts = pathname.includes("/products");
  const onCart = pathname.includes("/cart");
  const onAccount = pathname.includes("/account");
  const menu = store?.nav?.header ?? [];

  return (
    <>
      <nav className="sf-mobile-only" style={bar} aria-label={t.menu}>
        <TabLink href={storeHref(base)} icon="home" label={t.navHome} active={onHome} />
        <TabButton
          icon="grid"
          label={t.menu}
          active={menuOpen || onProducts}
          onClick={() => setMenuOpen(true)}
        />
        <TabButton
          icon="cart"
          label={t.navCart}
          active={onCart}
          onClick={goCart}
          badge={cartCount}
        />
        <TabLink
          href={storeHref(base, "/account")}
          icon="user"
          label={t.navAccount}
          active={onAccount}
        />
      </nav>

      {menuOpen ? (
        <MenuSheet
          base={base}
          categories={categories}
          menu={menu}
          t={t}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </>
  );
}

/* --------------------------------- tabs ---------------------------------- */

const tabBase: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  padding: "8px 0 7px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const tabLabel: CSSProperties = { fontSize: 11.5, fontWeight: 600, lineHeight: 1 };

function TabInner({ icon, label, active, badge }: { icon: IconName; label: string; active?: boolean; badge?: number }) {
  const color = active ? "var(--primary)" : "var(--muted)";
  return (
    <>
      <span style={{ position: "relative", display: "flex", color }}>
        <Icon name={icon} size={22} />
        {badge && badge > 0 ? (
          <span
            className="sf-mono"
            style={{
              position: "absolute",
              top: -6,
              right: -9,
              background: "var(--primary)",
              color: "var(--on-primary)",
              fontSize: 11,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span style={{ ...tabLabel, color }}>{label}</span>
    </>
  );
}

function TabLink({ href, icon, label, active }: { href: string; icon: IconName; label: string; active?: boolean }) {
  return (
    <Link href={href} style={tabBase} aria-current={active ? "page" : undefined}>
      <TabInner icon={icon} label={label} active={active} />
    </Link>
  );
}

function TabButton({ icon, label, active, badge, onClick }: { icon: IconName; label: string; active?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={tabBase} aria-pressed={active}>
      <TabInner icon={icon} label={label} active={active} badge={badge} />
    </button>
  );
}

/* ------------------------------- menu sheet ------------------------------- */

function MenuSheet({
  base,
  categories,
  menu,
  t,
  onClose,
}: {
  base: string;
  categories: CatalogCategory[];
  menu: StoreMenuItem[];
  t: T;
  onClose: () => void;
}) {
  useBodyScrollLock(true);

  // Flatten one level of admin menu items so nested links stay reachable.
  const menuLinks = menu.flatMap((m) => [
    { key: m.label, label: m.label, href: menuHref(m, base, categories) },
    ...(m.children ?? []).map((c) => ({
      key: `${m.label}:${c.label}`,
      label: c.label,
      href: menuHref(c, base, categories),
    })),
  ]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
      />
      <div
        style={{
          position: "relative",
          background: "var(--card)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom)",
          animation: "ezSlideUp 0.22s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{t.menu}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 12, margin: -12 }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "8px 0 14px" }}>
          <SheetLink href={storeHref(base, "/products")} label={t.allProducts} onClose={onClose} strong />
          {categories.map((c) => (
            <Fragment key={c._id}>
              <SheetLink
                href={collectionHref(base, c)}
                label={c.name}
                onClose={onClose}
              />
              {/* Sub-categories inline under their parent. This sheet is the
                  ONLY category navigation on mobile — the header's dropdown row
                  is desktop-only — so a child missing here is reachable only by
                  landing on the parent collection first. */}
              {(c.children ?? []).map((child) => (
                <SheetLink
                  key={child._id}
                  href={collectionHref(base, child)}
                  label={child.name}
                  onClose={onClose}
                  nested
                />
              ))}
            </Fragment>
          ))}

          {menuLinks.length > 0 ? (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "10px 18px" }} />
              {menuLinks.map((l) => (
                <SheetLink key={l.key} href={l.href} label={l.label} onClose={onClose} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SheetLink({
  href,
  label,
  onClose,
  strong,
  nested,
}: {
  href: string;
  label: string;
  onClose: () => void;
  strong?: boolean;
  /** A sub-category — indented and lighter, but still a ≥40px tap target. */
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // 12px of vertical padding around a ~16px line box keeps the nested row
        // at 40px — the storefront's tap-target floor — despite the smaller type.
        padding: nested ? "12px 18px 12px 34px" : "13px 18px",
        fontSize: nested ? 13.5 : 14.5,
        fontWeight: strong ? 700 : nested ? 400 : 500,
        color: nested ? "var(--muted)" : "var(--text)",
      }}
    >
      {label}
      <Icon name="chevR" size={16} style={{ color: "var(--faint)" }} />
    </Link>
  );
}
