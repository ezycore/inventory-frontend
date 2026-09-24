"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
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

/** A row that leaves the page. External links open in a new tab, as on desktop. */
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
  const body = (
    <>
      <Label node={node} images={images} />
      <Icon name="chevR" size={16} style={{ color: "var(--faint)", flex: "none" }} />
    </>
  );
  const style = { ...rowStyle(nested, strong), ...(current ? { color: "var(--primary)" } : null) };
  if (node.external) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" onClick={onClose} style={style}>
        {body}
      </a>
    );
  }
  return (
    <Link href={node.href} onClick={onClose} style={style} aria-current={current ? "page" : undefined}>
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
}: {
  nodes: MenuNode[];
  settings: PhoneMenu;
  onClose: () => void;
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  // Seeded once per opening — the panel unmounts when it closes, so the next
  // opening starts from the merchant's choice again rather than from however
  // the shopper left it.
  const [open, setOpen] = useState(() =>
    initialOpenKeys(nodes, PHONE_OPEN_RULE[settings.open], pathname),
  );
  const [drilled, setDrilled] = useState<string | null>(null);
  const { layout, viewAll, images } = settings;

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allRow = (node: MenuNode) => (
    <SheetLink
      node={{ ...node, label: t.menuAllIn.replace("{name}", node.label) }}
      onClose={onClose}
      nested
      strong
    />
  );

  const children = (node: MenuNode) =>
    node.children.map((child) => (
      <SheetLink
        key={child.key}
        node={child}
        onClose={onClose}
        nested
        current={isNodeActive(child, pathname)}
      />
    ));

  const drillNode = layout === "drill" ? nodes.find((n) => n.key === drilled) : undefined;
  if (drillNode) {
    return (
      <div className="sf-menu-step">
        <button type="button" onClick={() => setDrilled(null)} style={{ ...buttonReset, ...rowStyle(false, true), justifyContent: "flex-start" }}>
          <Icon name="chevR" size={16} style={{ transform: "rotate(180deg)", color: "var(--faint)" }} />
          {t.menuBack}
        </button>
        {viewAll ? allRow(drillNode) : <SheetLink node={drillNode} onClose={onClose} strong images={images} />}
        {children(drillNode)}
      </div>
    );
  }

  return (
    <>
      {nodes.map((node) => {
        const hasKids = node.children.length > 0;
        const active = isNodeActive(node, pathname);
        if (!hasKids) {
          return <SheetLink key={node.key} node={node} onClose={onClose} images={images} current={active} />;
        }
        if (layout === "expanded") {
          return (
            <div key={node.key}>
              <SheetLink node={node} onClose={onClose} images={images} current={active} />
              {children(node)}
            </div>
          );
        }
        if (layout === "drill") {
          return (
            <button key={node.key} type="button" onClick={() => setDrilled(node.key)} style={{ ...buttonReset, ...rowStyle() }}>
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
              <button type="button" onClick={() => toggle(node.key)} aria-expanded={isOpen} style={{ ...buttonReset, ...rowStyle(), ...(active ? { color: "var(--primary)" } : null) }}>
                <Label node={node} images={images} />
                {chevron}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <Link href={node.href} onClick={onClose} style={{ ...rowStyle(), flex: 1, minWidth: 0, paddingInlineEnd: 4, ...(active ? { color: "var(--primary)" } : null) }}>
                  <Label node={node} images={images} />
                </Link>
                <button type="button" onClick={() => toggle(node.key)} aria-expanded={isOpen} aria-label={toggleLabel} style={{ ...buttonReset, width: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
