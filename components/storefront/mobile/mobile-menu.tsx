"use client";
// coding-standard: maintained

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { chromeHas, type MobileChrome } from "@/lib/storefront-mobile";
import { menuHref } from "@/components/storefront/header-nav";
import { Icon } from "@/components/storefront/sf-icons";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * The mobile navigation panel — **one list, two containers**.
 *
 * Which container is `chrome.menuStyle`: a bottom `sheet` for the tab-bar
 * templates (the Menu tab is under the thumb, so the panel opens from there) or
 * a left `drawer` for the hamburger templates (it slides from the control that
 * opened it). The CONTENT is identical, written once — it is the only category
 * navigation a phone has, so a link missing from one of two copies is a
 * department a shopper cannot reach.
 */

type T = ReturnType<typeof useStorefrontUI>["t"];

/** What the utility bar above the phone bar is already carrying, if it shows. */
export interface UtilityNeeds {
  needsTheme: boolean;
  needsLang: boolean;
}

export function MobileMenuPanel({
  open,
  onClose,
  chrome,
  utilityNeeds,
  base,
  categories,
  menu,
}: {
  open: boolean;
  onClose: () => void;
  chrome: MobileChrome;
  utilityNeeds: UtilityNeeds;
  base: string;
  categories: CatalogCategory[];
  menu: StoreMenuItem[];
}) {
  const { t } = useStorefrontUI();
  const body = (
    <MenuBody
      base={base}
      categories={categories}
      menu={menu}
      chrome={chrome}
      utilityNeeds={utilityNeeds}
      t={t}
      onClose={onClose}
    />
  );

  if (chrome.menuStyle === "drawer") {
    // `SideDrawer` owns the scrim, the slide animation, the scroll lock and the
    // close button — the same shell the cart and the filter panel slide in on,
    // so the shop has one drawer rather than three that drift apart.
    return (
      <SideDrawer open={open} onClose={onClose} side="left" title={t.menu}>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 14px" }}>{body}</div>
      </SideDrawer>
    );
  }
  if (!open) return null;
  return (
    <MenuSheet onClose={onClose} title={t.menu}>
      {body}
    </MenuSheet>
  );
}

/* --------------------------------- sheet ---------------------------------- */

/** The bottom sheet: scrim, rounded top, capped at 72vh with its own scroll. */
function MenuSheet({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useBodyScrollLock(true);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
              padding: 12,
              margin: -12,
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 0 14px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------- body ---------------------------------- */

function MenuBody({
  base,
  categories,
  menu,
  chrome,
  utilityNeeds,
  t,
  onClose,
}: {
  base: string;
  categories: CatalogCategory[];
  menu: StoreMenuItem[];
  chrome: MobileChrome;
  utilityNeeds: UtilityNeeds;
  t: T;
  onClose: () => void;
}) {
  const { lang, theme, toggleLang, toggleTheme } = useStorefrontUI();

  // Flatten one level of admin menu items so nested links stay reachable.
  const menuLinks = menu.flatMap((m) => [
    { key: m.label, label: m.label, href: menuHref(m, base, categories) },
    ...(m.children ?? []).map((c) => ({
      key: `${m.label}:${c.label}`,
      label: c.label,
      href: menuHref(c, base, categories),
    })),
  ]);

  /* What the CHROME does not already offer, this panel has to.
     `drawer` and `minimal` put no account button on the bar and no Account tab
     at the bottom, so without these three rows a shopper on those templates
     could not reach their orders, switch language or leave the dark theme at
     all — a whole template's worth of dead ends. Asked per-item rather than
     per-template because a merchant rearranges the slots freely. */
  const needsAccount = !chromeHas(chrome, "account");
  /* Two owners to rule out for these, not one: the bar's own slots AND the
     utility bar above it, which carries the same pair and is the reason a
     drawer row could otherwise be the shopper's THIRD language switch. */
  const needsLang = !chromeHas(chrome, "lang") && utilityNeeds.needsLang;
  const needsTheme = !chromeHas(chrome, "theme") && utilityNeeds.needsTheme;

  return (
    <>
      <SheetLink href={storeHref(base, "/products")} label={t.allProducts} onClose={onClose} strong />
      {categories.map((c) => (
        <Fragment key={c._id}>
          <SheetLink href={collectionHref(base, c)} label={c.name} onClose={onClose} />
          {/* Sub-categories inline under their parent. This panel is the ONLY
              category navigation on mobile — the header's dropdown row is
              desktop-only — so a child missing here is reachable only by landing
              on the parent collection first. */}
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
          <Rule />
          {menuLinks.map((l) => (
            <SheetLink key={l.key} href={l.href} label={l.label} onClose={onClose} />
          ))}
        </>
      ) : null}

      {needsAccount || needsLang || needsTheme ? (
        <>
          <Rule />
          {needsAccount ? (
            <SheetLink
              href={storeHref(base, "/account")}
              label={t.myAccount}
              onClose={onClose}
            />
          ) : null}
          {needsLang ? (
            <SheetButton
              label={lang === "en" ? "বাংলা" : "English"}
              onClick={toggleLang}
            />
          ) : null}
          {needsTheme ? (
            <SheetButton
              label={theme === "dark" ? t.lightMode : t.darkMode}
              icon={theme === "dark" ? "sun" : "moon"}
              onClick={toggleTheme}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

const Rule = () => (
  <div style={{ height: 1, background: "var(--border)", margin: "10px 18px" }} />
);

/* `12px` of vertical padding around a ~16px line box keeps the nested row at
   40px — the storefront's tap-target floor — despite the smaller type. */
const rowStyle = (nested?: boolean, strong?: boolean) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: nested ? "12px 18px 12px 34px" : "13px 18px",
  fontSize: nested ? 13.5 : 14.5,
  fontWeight: strong ? 700 : nested ? 400 : 500,
  color: nested ? "var(--muted)" : "var(--text)",
});

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
    <Link href={href} onClick={onClose} style={rowStyle(nested, strong)}>
      {label}
      <Icon name="chevR" size={16} style={{ color: "var(--faint)" }} />
    </Link>
  );
}

/**
 * A row that changes the page rather than leaving it — language and theme.
 *
 * Deliberately does NOT close the panel: a shopper switching to Bangla wants to
 * see the menu they are reading change, and closing it would leave them to
 * reopen it and check.
 */
function SheetButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: "sun" | "moon";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...rowStyle(),
        width: "100%",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      {label}
      {icon ? <Icon name={icon} size={16} style={{ color: "var(--faint)" }} /> : null}
    </button>
  );
}
