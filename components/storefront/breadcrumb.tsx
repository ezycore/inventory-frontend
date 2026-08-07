// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Crumb } from "@/lib/storefront-breadcrumb";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * The visible trail. Its twin is the `BreadcrumbList` JSON-LD, and both are
 * built from the same `lib/storefront-breadcrumb` helpers so the markup and the
 * structured data cannot claim different things.
 *
 * Deliberately not a client component — it holds no state and reads no hook, so
 * it renders inside the server-rendered PDP shell *and* inside client views.
 */
export function Breadcrumb({ base, crumbs }: { base: string; crumbs: Crumb[] }) {
  // One crumb is just the page naming itself — a trail with nowhere to go is
  // chrome, not navigation.
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 12 }}>
      <ol style={list}>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.path}:${i}`} style={item}>
              {last ? (
                // The current page: named, not linked. `aria-current` is what
                // tells a screen reader the trail has ended.
                <span aria-current="page" style={current}>
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={storeHref(base, crumb.path)} style={link}>
                    {crumb.name}
                  </Link>
                  <Icon name="chevR" size={13} style={separator} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const list: CSSProperties = {
  display: "flex",
  // Wraps rather than scrolling: a long "Phones › Accessories › <product>" on a
  // 320px screen must stay fully readable, and a horizontal scroller hides the
  // rung the shopper actually wants.
  flexWrap: "wrap",
  alignItems: "center",
  gap: 4,
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const item: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  minWidth: 0,
};

const link: CSSProperties = {
  fontSize: 12.5,
  color: "var(--muted)",
  // Vertical padding keeps the tap target usable without moving the text — the
  // storefront's ≥40px rule applies to a trail as much as to a nav row.
  padding: "9px 0",
};

const current: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text)",
  padding: "9px 0",
};

const separator: CSSProperties = { color: "var(--faint)", flex: "none" };
