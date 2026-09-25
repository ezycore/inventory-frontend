"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  PHONE_OPEN_RULE,
  initialOpenKeys,
  isNodeActive,
  type MenuNode,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { SfImage } from "@/components/storefront/sf-image";

type PhoneMenu = ResolvedMenuSettings["mobile"];

/* `12px` of vertical padding around a ~16px line box keeps the nested row at
   40px — the storefront's tap-target floor — despite the smaller type. */
export const rowStyle = (nested?: boolean, strong?: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: nested ? "12px 18px 12px 34px" : "13px 18px",
  fontSize: nested ? 13.5 : 14.5,
  fontWeight: strong ? 700 : nested ? 400 : 500,
  color: nested ? "var(--muted)" : "var(--text)",
});

/**
 * The page the shopper is on, and the department holding it.
 *
 * The look is the merchant's (Customize → Menu → Current page) and lives in
 * `storefront.css` under `.sf-current` / `.sf-current-trail`, shared with every
 * other menu surface. The row's own colour and weight are inline, so a marked
 * row drops those two and lets the stylesheet decide.
 */
const marked = (style: CSSProperties): CSSProperties => ({
  ...style,
  color: undefined,
  fontWeight: undefined,
});
const rowClass = (state?: "current" | "trail") =>
  state === "current" ? "sf-menu-row sf-current" : state === "trail" ? "sf-menu-row sf-current-trail" : "sf-menu-row";

const buttonReset: CSSProperties = {
  width: "100%",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};

/** A category's thumbnail, when the merchant turned pictures on and it has one. */
function Thumb({ node, show }: { node: Pick<MenuNode, "image">; show: boolean }) {
  if (!show || !node.image) return null;
  return (
    <SfImage
      image={node.image}
      alt=""
      decorative
      sizes="28px"
      width={28}
      height={28}
      loading="lazy"
      style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover", flex: "none" }}
    />
  );
}

function Label({ node, images }: { node: Pick<MenuNode, "label" | "image">; images: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Thumb node={node} show={images} />
      <span style={{ minWidth: 0 }}>{node.label}</span>
    </span>
  );
}

/**
 * A row that leaves the page. External links open in a new tab, as on desktop.
 * No chevron: on a phone it promises a sub-menu, and a leaf has none — only a
 * parent row (accordion or drill) draws one.
 */
export function SheetLink({
  node,
  onClose,
  strong,
  nested,
  images = false,
  current,
}: {
  node: Pick<MenuNode, "href" | "external" | "label" | "image">;
  onClose: () => void;
  strong?: boolean;
  /** A sub-category — indented and lighter, but still a ≥40px tap target. */
  nested?: boolean;
  images?: boolean;
  current?: boolean;
}) {
  const body = <Label node={node} images={images} />;
  const style = current ? marked(rowStyle(nested, strong)) : rowStyle(nested, strong);
  const className = rowClass(current ? "current" : undefined);
  if (node.external) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" onClick={onClose} style={style} className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link
      href={node.href}
      onClick={onClose}
      style={style}
      className={className}
      aria-current={current ? "page" : undefined}
    >
      {body}
    </Link>
  );
}

/**
 * The menu's links on a phone, in the merchant's chosen `layout`.
 *
 * - `accordion` (the default for every shop — owner decision A) — a category
 *   folds open in place. With `viewAll` the whole row is the toggle and the
 *   group's first row is "All ‹category›"; without it the row splits, the label
 *   leaving for the category and a chevron folding it, so the parent page is
 *   never unreachable.
 * - `drill` — a category opens its own screen, with a Back row. For shops with
 *   so many sub-categories that even one open group is a long scroll.
 * - `expanded` — every group open, always: the list as it was before.
 */
export function MenuTreeList({
  nodes,
  settings,
  onClose,
  lead,
}: {
  nodes: MenuNode[];
  settings: PhoneMenu;
  onClose: () => void;
  /**
   * A row drawn above the menu on the top screen only (the drawer's "All
   * products"). Owned here rather than by the caller because only this list
   * knows when a category screen is open — above a Back row it read as the
   * first thing inside the category.
   */
  lead?: ReactNode;
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  // Seeded once per opening — the panel unmounts when it closes, so the next
  // opening starts from the merchant's choice again rather than from however
  // the shopper left it.
  //
  // The department holding the current page is ALWAYS open (or, in `drill`,
  // is the screen the panel opens on), whatever the merchant's "open when the
  // menu opens" choice: that setting decides what else is open, and a shopper
  // on Cushion › Cartoon who opens the menu expects to find Cartoon, not a
  // folded Cushion to hunt through.
  const activeGroup = nodes.find((n) => n.children.length > 0 && isNodeActive(n, pathname))?.key;
  const [open, setOpen] = useState(() => {
    const keys = initialOpenKeys(nodes, PHONE_OPEN_RULE[settings.open], pathname);
    if (activeGroup) keys.add(activeGroup);
    return keys;
  });
  const [drilled, setDrilled] = useState<string | null>(() => activeGroup ?? null);
  const { layout, viewAll, images, subImages } = settings;

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // "All ‹category›" is the current row when the shopper is on the
  // department's own page rather than one of its children.
  const onOwnPage = (node: MenuNode) =>
    isNodeActive({ ...node, children: [] }, pathname) &&
    !node.children.some((child) => isNodeActive(child, pathname));

  const allRow = (node: MenuNode) => (
    <SheetLink
      node={{ ...node, label: t.menuAllIn.replace("{name}", node.label) }}
      onClose={onClose}
      nested
      strong
      current={onOwnPage(node)}
    />
  );

  const children = (node: MenuNode) =>
    node.children.map((child) => (
      <SheetLink
        key={child.key}
        node={child}
        onClose={onClose}
        nested
        images={subImages}
        current={isNodeActive(child, pathname)}
      />
    ));

  const drillNode = layout === "drill" ? nodes.find((n) => n.key === drilled) : undefined;
  if (drillNode) {
    return (
      <div className="sf-menu-step">
        <button type="button" className="sf-menu-row" onClick={() => setDrilled(null)} style={{ ...buttonReset, ...rowStyle(false, true), justifyContent: "flex-start" }}>
          <Icon name="chevR" size={16} style={{ transform: "rotate(180deg)", color: "var(--faint)" }} />
          {t.menuBack}
        </button>
        {viewAll ? (
          allRow(drillNode)
        ) : (
          <SheetLink node={drillNode} onClose={onClose} strong images={images} current={onOwnPage(drillNode)} />
        )}
        {children(drillNode)}
      </div>
    );
  }

  return (
    <>
      {lead}
      {nodes.map((node) => {
        const hasKids = node.children.length > 0;
        const active = isNodeActive(node, pathname);
        if (!hasKids) {
          return <SheetLink key={node.key} node={node} onClose={onClose} images={images} current={active} />;
        }
        if (layout === "expanded") {
          return (
            <div key={node.key}>
              <SheetLink node={node} onClose={onClose} images={images} current={onOwnPage(node)} />
              {children(node)}
            </div>
          );
        }
        if (layout === "drill") {
          return (
            <button key={node.key} type="button" className={rowClass(active ? "trail" : undefined)} onClick={() => setDrilled(node.key)} style={{ ...buttonReset, ...(active ? marked(rowStyle()) : rowStyle()) }}>
              <Label node={node} images={images} />
              <Icon name="chevR" size={16} style={{ color: "var(--faint)", flex: "none" }} />
            </button>
          );
        }
        const isOpen = open.has(node.key);
        const chevron = (
          <Icon
            name="chevD"
            size={16}
            style={{ color: "var(--faint)", flex: "none", transition: "transform 0.18s ease", transform: isOpen ? "rotate(180deg)" : undefined }}
          />
        );
        const toggleLabel = t.menuToggle.replace("{name}", node.label);
        return (
          <div key={node.key}>
            {viewAll ? (
              <button type="button" className={rowClass(active ? "trail" : undefined)} onClick={() => toggle(node.key)} aria-expanded={isOpen} style={{ ...buttonReset, ...(active ? marked(rowStyle()) : rowStyle()) }}>
                <Label node={node} images={images} />
                {chevron}
              </button>
            ) : (
              <div
                className={onOwnPage(node) ? "sf-current" : undefined}
                style={{ display: "flex", alignItems: "stretch" }}
              >
                <Link
                  href={node.href}
                  onClick={onClose}
                  className={rowClass(active && !onOwnPage(node) ? "trail" : undefined)}
                  aria-current={onOwnPage(node) ? "page" : undefined}
                  style={{ ...(active ? marked(rowStyle()) : rowStyle()), flex: 1, minWidth: 0, paddingInlineEnd: 4 }}
                >
                  <Label node={node} images={images} />
                </Link>
                <button type="button" className="sf-menu-row" onClick={() => toggle(node.key)} aria-expanded={isOpen} aria-label={toggleLabel} style={{ ...buttonReset, width: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {chevron}
                </button>
              </div>
            )}
            {isOpen ? (
              <div className="sf-menu-group">
                {viewAll ? allRow(node) : null}
                {children(node)}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
