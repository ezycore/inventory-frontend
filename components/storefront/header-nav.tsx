"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
 * Build a leaf-slug → slugPath lookup for resolving category menu items.
 *
 * Both levels are indexed. A leaf slug is only unique *within its parent*, so two
 * children can share one — the first wins here, which is the same ambiguity the
 * menu editor itself has (it stores a bare slug). Picking the parent's own entry
 * first keeps the common case right.
 */
function catMap(categories: CatalogCategory[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of categories) {
    if (c.slug && c.slugPath && !m.has(c.slug)) m.set(c.slug, c.slugPath);
    for (const child of c.children ?? []) {
      if (child.slug && child.slugPath && !m.has(child.slug)) {
        m.set(child.slug, child.slugPath);
      }
    }
  }
  return m;
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
  if (!menu.some((m) => m.type === "collections")) return menu;
  return menu.flatMap((m) =>
    m.type === "collections"
      ? categories
          .filter((c) => !!c.slugPath)
          .map(
            (c): StoreMenuItem => ({
              label: c.name,
              type: "url",
              value: `/${c.slugPath}`,
              // Sub-categories become the item's dropdown children, so a shopper
              // reaches "Phones › Accessories" without leaving the header.
              children: (c.children ?? [])
                .filter((child) => !!child.slugPath)
                .map((child) => ({
                  label: child.name,
                  type: "url" as const,
                  value: `/${child.slugPath}`,
                })),
            }),
          )
      : [m],
  );
}

function resolveHref(
  item: StoreMenuItem,
  base: string,
  catBySlug: Map<string, string>,
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
  const path = catBySlug.get(item.value);
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

const dropPanel: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 6,
  minWidth: 180,
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  padding: 6,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  zIndex: 40,
};

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

  const [open, setOpen] = useState<number | null>(null);

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
            onMouseEnter={() => hasKids && setOpen(i)}
            onMouseLeave={() => setOpen((o) => (o === i ? null : o))}
            onFocus={() => hasKids && setOpen(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOpen((o) => (o === i ? null : o));
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
            {hasKids && open === i ? (
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
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
