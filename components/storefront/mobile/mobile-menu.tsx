"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { storeHref } from "@/lib/storefront-links";
import type { MenuNode, ResolvedMenuSettings } from "@/lib/storefront-menu";
import { chromeHas, type MobileChrome } from "@/lib/storefront-mobile";
import { storePages } from "@/lib/storefront-page-controls";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { Icon } from "@/components/storefront/sf-icons";
import {
  MenuTreeList,
  SheetLink,
  rowStyle,
} from "@/components/storefront/mobile/mobile-menu-tree";
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
  nodes,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  chrome: MobileChrome;
  utilityNeeds: UtilityNeeds;
  base: string;
  /** The resolved phone menu — `useStoreMenu().phoneTree`. */
  nodes: MenuNode[];
  settings: ResolvedMenuSettings["mobile"];
}) {
  const { t } = useStorefrontUI();
  const body = (
    <MenuBody
      base={base}
      nodes={nodes}
      settings={settings}
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
  nodes,
  settings,
  chrome,
  utilityNeeds,
  t,
  onClose,
}: {
  base: string;
  nodes: MenuNode[];
  settings: ResolvedMenuSettings["mobile"];
  chrome: MobileChrome;
  utilityNeeds: UtilityNeeds;
  t: T;
  onClose: () => void;
}) {
  const { lang, theme, toggleLang, toggleTheme } = useStorefrontUI();

  /* What the CHROME does not already offer, this panel has to.
     `drawer` and `minimal` put no account button on the bar and no Account tab
     at the bottom, so without these three rows a shopper on those templates
     could not reach their orders, switch language or leave the dark theme at
     all — a whole template's worth of dead ends. Asked per-item rather than
     per-template because a merchant rearranges the slots freely. */
  /* Read from the STORE, not from the chrome. The chrome has already had
     `account` filtered out when the merchant switched the account area off
     (§6 page controls), and this row asks the inverse question — "does the
     bar lack one, so the panel owes the shopper it?" — which would answer
     YES for a shop that has no account area at all, adding the one link
     that must disappear back on the surface of last resort. */
  const { slug } = useStoreContext();
  const { data: accountStore } = useStore(slug);
  const needsAccount =
    storePages(accountStore).accounts && !chromeHas(chrome, "account");
  /* Two owners to rule out for these, not one: the bar's own slots AND the
     utility bar above it, which carries the same pair and is the reason a
     drawer row could otherwise be the shopper's THIRD language switch. */
  const needsLang = !chromeHas(chrome, "lang") && utilityNeeds.needsLang;
  const needsTheme = !chromeHas(chrome, "theme") && utilityNeeds.needsTheme;

  return (
    <>
      {/* The resolved menu — the SAME tree the desktop header draws, so the
          Menu links setting finally governs the phone too (decision B). It
          used to print every category and then the custom menu flattened
          beneath it, so a custom menu listed its departments twice. */}
      <MenuTreeList
        nodes={nodes}
        settings={settings}
        onClose={onClose}
        lead={
          <SheetLink
            node={{ href: storeHref(base, "/products"), external: false, label: t.allProducts }}
            onClose={onClose}
            strong
          />
        }
      />

      {needsAccount || needsLang || needsTheme ? (
        <>
          <Rule />
          {needsAccount ? (
            <SheetLink
              node={{ href: storeHref(base, "/account"), external: false, label: t.myAccount }}
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
