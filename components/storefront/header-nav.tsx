"use client";
// coding-standard: maintained

import { useRef, useState, type CSSProperties } from "react";
import {
  DEFAULT_MENU_SETTINGS,
  isNodeActive,
  type MenuNode,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { NavDropdown, NavLink } from "@/components/storefront/header/nav-dropdown";
import { useNavMenu, useNavOverflow } from "@/components/storefront/header/use-nav-menu";

type DesktopMenu = ResolvedMenuSettings["desktop"];

const GAP = 22;

const defaultRow = (center?: boolean): CSSProperties => ({
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  padding: "0 var(--pad) 11px",
  display: "flex",
  gap: GAP,
  alignItems: "center",
  justifyContent: center ? "center" : "flex-start",
});

const chevron = (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/**
 * The desktop header menu: one row of top links, each with an optional
 * dropdown. Draws a resolved `MenuNode[]` (`lib/storefront-menu.ts`) and knows
 * nothing about where the links came from.
 *
 * Every anatomy that has a menu row renders THIS — Classic and Centered through
 * `CategoryRow`, Minimal and Boutique directly with their own typography in
 * `linkStyle` — so a dropdown, a merchant's hover effect and the Menu settings
 * reach all of them. Minimal and Boutique used to draw a flat row of their own,
 * which silently dropped every dropdown.
 *
 * ⚠ The row WRAPS (or collapses into More), never scrolls: a scroll container
 * clips on both axes, so an absolutely positioned dropdown would be cut off at
 * the row's bottom edge.
 */
export function HeaderNav({
  nodes,
  menu = DEFAULT_MENU_SETTINGS.desktop,
  center,
  rowStyle,
  linkStyle,
}: {
  nodes: MenuNode[];
  menu?: DesktopMenu;
  center?: boolean;
  /** Replaces the row's default box — for anatomies that place it themselves. */
  rowStyle?: CSSProperties;
  /**
   * An anatomy's own TYPOGRAPHY for the top links (size, weight, tracking).
   * Never a colour — see `NavLink`.
   */
  linkStyle?: CSSProperties;
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  const rowRef = useRef<HTMLElement>(null);
  const nav = useNavMenu(menu.openOn, rowRef);
  const lastPointer = useRef<string>("mouse");
  // Set when a TAP opened the dropdown rather than a pointer resting on it —
  // the panel then has to carry the parent's own page, which the tap skipped.
  const [viaTouch, setViaTouch] = useState(false);
  const more = menu.overflow === "more";
  // An anatomy's own gap when it states one in pixels; the measurement is only
  // as right as the spacing it assumes.
  const gap = typeof rowStyle?.gap === "number" ? rowStyle.gap : GAP;
  const visible = useNavOverflow(
    rowRef,
    nodes.length,
    gap,
    more,
    nodes.map((n) => n.label).join("\u0001"),
  );

  const shown = nodes.slice(0, visible);
  const hidden = nodes.slice(visible);
  const items: MenuNode[] = hidden.length
    ? [
        ...shown,
        // The overflow becomes one more dropdown, holding the links that did
        // not fit. Its own children are dropped: a menu two levels deep inside
        // a "More" is a maze, and each of those links still lands on a page
        // that lists its sub-categories.
        {
          key: "__more",
          label: t.menuMore,
          href: "#",
          external: false,
          children: hidden.map((n) => ({ ...n, children: [] })),
        },
      ]
    : shown;

  return (
    <nav
      ref={rowRef}
      style={{
        ...(rowStyle ?? defaultRow(center)),
        position: menu.dropdown === "mega" ? "relative" : undefined,
        flexWrap: more ? "nowrap" : "wrap",
      }}
    >
      {items.map((node, i) => {
        const hasKids = node.children.length > 0;
        const isMore = node.key === "__more";
        // A trigger that no longer navigates on its own: a click-to-open item,
        // and the More menu, which has no page of its own.
        const trigger = hasKids && (menu.openOn === "click" || isMore);
        const open = nav.open === i;
        // The department holding the page — its dropdown is shut most of the
        // time, so the top link is the only "you are here" the header shows.
        // On the More menu it means the page's own link collapsed into it.
        const current = isNodeActive(node, pathname);
        return (
          <div
            key={node.key}
            data-nav-item={isMore ? undefined : ""}
            style={{ position: menu.dropdown === "mega" && !isMore ? "static" : "relative" }}
            onPointerDown={(e) => {
              lastPointer.current = e.pointerType;
            }}
            // Pointer events, not mouse events: they say WHICH pointer, so a
            // touch's emulated hover is ignored while a mouse on the same
            // hybrid laptop still opens the menu the moment it arrives.
            onPointerEnter={(e) => {
              if (!hasKids || e.pointerType === "touch") return;
              setViaTouch(false);
              nav.enter(i);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== "touch") nav.leave(i);
            }}
            onFocus={() => hasKids && menu.openOn === "hover" && nav.show(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) nav.close(i);
            }}
          >
            {trigger ? (
              <button
                type="button"
                className={`sf-nav-top sf-nav-bar sf-nav-trigger${current ? " sf-current" : ""}`}
                style={current && linkStyle ? { ...linkStyle, fontWeight: undefined } : linkStyle}
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => nav.toggle(i)}
              >
                {node.label}
                {chevron}
              </button>
            ) : (
              <NavLink
                node={node}
                className="sf-nav-top sf-nav-bar"
                style={linkStyle}
                current={current}
                onClick={(e) => {
                  // A touch has no hover, so on a tablet the first tap on a
                  // parent opens its dropdown instead of leaving the page; the
                  // panel's first row is the parent's own page.
                  if (hasKids && !open && lastPointer.current === "touch") {
                    e.preventDefault();
                    setViaTouch(true);
                    nav.show(i);
                  }
                }}
              >
                {node.label}
                {hasKids ? chevron : null}
              </NavLink>
            )}
            {hasKids && open ? (
              <NavDropdown
                node={node}
                mode={isMore ? "list" : menu.dropdown}
                // The merchant's switch, forced on whenever the trigger did
                // not navigate (click-to-open, a tap) — the row is then the
                // only way into the parent's page. The dropdown LAYOUT has no
                // say: Columns once showed it and List did not, which read as
                // the layout's doing.
                viewAll={
                  !isMore && (menu.viewAll || menu.openOn === "click" || viaTouch)
                }
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
