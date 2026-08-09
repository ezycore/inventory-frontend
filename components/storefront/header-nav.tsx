"use client";
// coding-standard: maintained

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";

/**
 * Resolve an admin-configured menu item to a concrete href.
 *   - url      → relative paths go through `storeHref`; absolute http(s) stay as-is.
 *   - page     → `/pages/{slug}` under the store base.
 *   - category → the editor stores the category's LEAF slug, but a collection is
 *                addressed by its full path (`phones/accessories`), so the path
 *                is looked up in the live category list and we fall back to the
 *                unfiltered listing if unknown.
 */
/**
 * Build a leaf-slug → category lookup for resolving category menu items.
 *
 * Both levels are indexed. A leaf slug is only unique *within its parent*, so two
 * children can share one — the first wins here, which is the same ambiguity the
 * menu editor itself has (it stores a bare slug). **Every parent is indexed
 * before any child** so a top-level collection always beats a same-named child;
 * a single interleaved pass would let the first parent's child shadow a later
 * parent, which is the opposite of the intended precedence.
 */
function catMap(categories: CatalogCategory[]): Map<string, CatalogCategory> {
  const m = new Map<string, CatalogCategory>();
  for (const c of categories) {
    if (c.slug && c.slugPath && !m.has(c.slug)) m.set(c.slug, c);
  }
  for (const c of categories) {
    for (const child of c.children ?? []) {
      if (child.slug && child.slugPath && !m.has(child.slug)) m.set(child.slug, child);
    }
  }
  return m;
}

/** A category's sub-categories as dropdown links. Unroutable nodes are dropped. */
function childItems(category: CatalogCategory | undefined): StoreMenuItem[] {
  return (category?.children ?? [])
    .filter((child) => !!child.slugPath)
    .map((child) => ({
      label: child.name,
      type: "url" as const,
      value: `/${child.slugPath}`,
    }));
}

/** Convenience href resolver for a single menu item (used by compact headers). */
export function menuHref(
  item: StoreMenuItem,
  base: string,
  categories: CatalogCategory[],
): string {
  return resolveHref(item, base, catMap(categories)).href;
}

/**
 * Expand "collections" block items into the store's listed collections, in
 * place. Runs once where the header menu enters the component tree
 * (StoreHeader's ctx), so every variant — dropdown nav, Minimal, mobile — and
 * the admin live preview render the expansion without knowing about the type.
 * Expanded links use each collection's PATH — its canonical URL. A node with no
 * `slugPath` cannot route and is skipped rather than emitted as a dead link.
 * Top level only; the category tree's own `children` are surfaced by the
 * dropdown, not by flattening them into the top bar.
 */
export function expandHeaderMenu(
  menu: StoreMenuItem[],
  categories: CatalogCategory[],
): StoreMenuItem[] {
  // Two kinds of item need the tree. Checked up front so a menu needing neither
  // keeps its identity and the header does not re-render for nothing.
  const needsTree = menu.some(
    (m) =>
      m.type === "collections" || (m.type === "category" && !m.children?.length),
  );
  if (!needsTree) return menu;

  const bySlug = catMap(categories);
  return menu.flatMap((m): StoreMenuItem[] => {
    if (m.type === "collections") {
      return categories
        .filter((c) => !!c.slugPath)
        .map((c) => ({
          label: c.name,
          type: "url",
          value: `/${c.slugPath}`,
          // Sub-categories become the item's dropdown children, so a shopper
          // reaches "Phones › Accessories" without leaving the header.
          children: childItems(c),
        }));
    }
    // A HAND-PICKED category item inherits its own sub-categories too. Without
    // this, nesting only worked for stores using a `collections` block — a
    // merchant who chose their top links one by one (the common case once you
    // open Customize) got a flat menu, which is the whole complaint.
    // An explicitly authored child list always wins: that is the merchant
    // overriding the default, not an empty one to fill in.
    if (m.type === "category" && !m.children?.length) {
      const kids = childItems(bySlug.get(m.value));
      return kids.length ? [{ ...m, children: kids }] : [m];
    }
    return [m];
  });
}

function resolveHref(
  item: StoreMenuItem,
  base: string,
  catBySlug: Map<string, CatalogCategory>,
): { href: string; external: boolean } {
  if (item.type === "url") {
    const v = item.value || "/";
    if (/^https?:\/\//i.test(v)) return { href: v, external: true };
    return { href: storeHref(base, v.startsWith("/") ? v : `/${v}`), external: false };
  }
  if (item.type === "page") {
    return { href: storeHref(base, `/pages/${item.value}`), external: false };
  }
  // category — linked by PATH, which is the collection's canonical URL.
  const path = catBySlug.get(item.value)?.slugPath;
  return {
    href: storeHref(base, path ? `/${path}` : "/products"),
    external: false,
  };
}

function NavLink({
  href,
  external,
  style,
  children,
}: {
  href: string;
  external: boolean;
  style: CSSProperties;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}

const topLink: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--muted)",
  whiteSpace: "nowrap",
  padding: "2px 0",
};

/**
 * The dropdown's positioned box. The 6px offset below the trigger is **padding
 * on this anchor, never a margin on the panel** — an absolutely-positioned
 * panel sits outside its parent's box, so a margin gap belongs to no element at
 * all: the pointer crossing it left the trigger, fired `mouseleave`, and the
 * menu closed before the cursor ever reached an option. As padding, the strip
 * is part of the dropdown's own hit area and the hover path is unbroken.
 */
const dropAnchor: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  paddingTop: 6,
  zIndex: 40,
};

const dropPanel: CSSProperties = {
  minWidth: 180,
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  padding: 6,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

/**
 * Grace period before a `mouseleave` actually closes the menu. The padding
 * bridge above fixes the straight-down path; this covers the rest — a fast or
 * diagonal move can have the pointer register outside both boxes for a frame,
 * and re-entering within the delay simply cancels the close.
 */
const CLOSE_DELAY_MS = 140;

/** Which top-level item is open, with the close grace period applied. */
function useHoverMenu() {
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return {
    open,
    show: (i: number) => {
      cancelClose();
      setOpen(i);
    },
    /** Pointer left — close unless the pointer comes back first. */
    scheduleClose: (i: number) => {
      cancelClose();
      closeTimer.current = setTimeout(
        () => setOpen((o) => (o === i ? null : o)),
        CLOSE_DELAY_MS,
      );
    },
    /** Focus left the item — no grace period, keyboard moves are deliberate. */
    close: (i: number) => {
      cancelClose();
      setOpen((o) => (o === i ? null : o));
    },
  };
}

const dropLink: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text)",
  padding: "7px 10px",
  borderRadius: 7,
  whiteSpace: "nowrap",
};

/**
 * Storefront header menu (admin Customize → Header). Renders one level
 * of dropdowns on hover/focus. The store-shell uses this when a menu is
 * configured and falls back to the raw category list otherwise.
 */
export function HeaderNav({
  base,
  menu,
  categories,
  center,
}: {
  base: string;
  menu: StoreMenuItem[];
  categories: CatalogCategory[];
  center?: boolean;
}) {
  const catBySlug = useMemo(() => catMap(categories), [categories]);

  const hover = useHoverMenu();

  return (
    <nav
      style={{
        maxWidth: "var(--maxw)",
        margin: "0 auto",
        padding: "0 var(--pad) 11px",
        display: "flex",
        gap: 22,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {menu.map((item, i) => {
        const top = resolveHref(item, base, catBySlug);
        const kids = item.children ?? [];
        const hasKids = kids.length > 0;
        return (
          <div
            key={i}
            style={{ position: "relative" }}
            onMouseEnter={() => hasKids && hover.show(i)}
            onMouseLeave={() => hover.scheduleClose(i)}
            onFocus={() => hasKids && hover.show(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                hover.close(i);
              }
            }}
          >
            <NavLink href={top.href} external={top.external} style={topLink}>
              {item.label}
              {hasKids ? (
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
              ) : null}
            </NavLink>
            {hasKids && hover.open === i ? (
              <div style={dropAnchor}>
                <div style={dropPanel}>
                  {kids.map((child, ci) => {
                    const c = resolveHref(child, base, catBySlug);
                    return (
                      <NavLink
                        key={ci}
                        href={c.href}
                        external={c.external}
                        style={dropLink}
                      >
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
