"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { isNodeActive, type MenuDropdown, type MenuNode } from "@/lib/storefront-menu";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { SfImage } from "@/components/storefront/sf-image";

/**
 * One menu link — a `Link` inside the shop, a plain new-tab `<a>` outside it.
 *
 * ⚠ **A class, never an inline colour.** These links carried their colour as
 * inline `CSSProperties` once, and an inline declaration outranks every rule in
 * the stylesheet, so the merchant's `:hover` choice could not reach them. The
 * look lives in `storefront.css` under `.sf-nav-top` / `.sf-nav-child`.
 */
export function NavLink({
  node,
  className: baseClass,
  style: baseStyle,
  onClick,
  current,
  children,
}: {
  node: Pick<MenuNode, "href" | "external">;
  className: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * The page the shopper is on. Adds `.sf-current` — the merchant's Current
   * page style, shared with every menu surface — and drops an inline weight
   * so the stylesheet can set it.
   */
  current?: boolean;
  children: ReactNode;
}) {
  const className = current ? `${baseClass} sf-current` : baseClass;
  const style = current && baseStyle ? { ...baseStyle, fontWeight: undefined } : baseStyle;
  if (node.external) {
    return (
      <a
        href={node.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={node.href}
      className={className}
      style={style}
      onClick={onClick}
      aria-current={current ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

/**
 * The dropdown's positioned box. The 6px offset below the trigger is **padding
 * on this anchor, never a margin on the panel** — an absolutely-positioned
 * panel sits outside its parent's box, so a margin gap belongs to no element at
 * all: the pointer crossing it left the trigger, fired `mouseleave`, and the
 * menu closed before the cursor ever reached an option. As padding, the strip
 * is part of the dropdown's own hit area and the hover path is unbroken.
 *
 * `mega` anchors to the whole ROW (its item wrapper is left unpositioned), so
 * it spans the header rather than hanging off one link.
 */
const anchor = (mode: MenuDropdown): CSSProperties => ({
  position: "absolute",
  top: "100%",
  left: mode === "mega" ? "var(--pad)" : 0,
  right: mode === "mega" ? "var(--pad)" : undefined,
  paddingTop: 6,
  zIndex: 40,
});

const panel: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  padding: 6,
};

/** Past this many children a `columns` dropdown splits; one column per this many. */
const PER_COLUMN = 8;

/**
 * The panel under a top link.
 *
 * - `list` — one column, the dropdown every shop had before this setting.
 * - `columns` — the same rows flowed into up to four columns once there are
 *   more than eight, so twenty sub-categories stop running off the screen.
 * - `mega` — a full-width panel with the category pictures, for shops whose
 *   merchandise reads better as pictures than as words.
 *
 * `viewAll` heads the panel with the parent's own page. It is on whenever the
 * trigger stopped being a link — a click-to-open trigger, a touch that opened
 * the panel instead of navigating — because otherwise that page has no way in
 * from the header at all.
 */
export function NavDropdown({
  node,
  mode,
  viewAll,
}: {
  node: MenuNode;
  mode: MenuDropdown;
  viewAll: boolean;
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  const kids = node.children;
  const on = (child: MenuNode) => isNodeActive(child, pathname);
  // "All ‹category›" is the page only on the department itself, not beneath it.
  const onParent =
    isNodeActive({ ...node, children: [] }, pathname) && !kids.some(on);
  const allRow = viewAll ? (
    <NavLink node={node} className="sf-nav-child" style={{ fontWeight: 700 }} current={onParent}>
      {t.menuAllIn.replace("{name}", node.label)}
    </NavLink>
  ) : null;

  if (mode === "mega") {
    return (
      <div style={anchor(mode)}>
        <div style={{ ...panel, padding: 14 }}>
          {allRow ? <div style={{ marginBottom: 8 }}>{allRow}</div> : null}
          <div className="sf-nav-mega">
            {kids.map((child) => (
              <NavLink key={child.key} node={child} className="sf-nav-child sf-nav-mega-item" current={on(child)}>
                <SfImage
                  image={child.image}
                  alt=""
                  decorative
                  sizes="48px"
                  width={48}
                  height={48}
                  loading="lazy"
                  className="sf-nav-mega-img"
                />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const columns = mode === "columns" ? Math.min(4, Math.ceil(kids.length / PER_COLUMN)) : 1;
  return (
    <div style={anchor(mode)}>
      <div
        className={columns > 1 ? "sf-nav-cols" : undefined}
        style={{
          ...panel,
          minWidth: 180,
          display: columns > 1 ? "block" : "flex",
          flexDirection: "column",
          gap: 2,
          columnCount: columns > 1 ? columns : undefined,
          columnGap: 6,
          width: columns > 1 ? `${columns * 190}px` : undefined,
          maxWidth: "calc(100vw - 2 * var(--pad))",
        }}
      >
        {allRow}
        {kids.map((child) => (
          <NavLink key={child.key} node={child} className="sf-nav-child" current={on(child)}>
            {child.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
