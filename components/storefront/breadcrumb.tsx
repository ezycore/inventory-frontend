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

  // The rung one above this page — what the phone's back link points at.
  const parent = crumbs[crumbs.length - 2];
  // "‹ <store name>" on a top-level category only repeats the logo above it.
  const showBack = parent.path !== "";

  return (
    <nav aria-label="Breadcrumb" className="sf-crumbs">
      {/* Desktop: the full trail. */}
      <ol className="sf-desktop-only" style={list}>
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
      {/* Phone: one "‹ Parent" link. The full trail wrapped to two lines on a
          390px screen and repeated both the logo (store crumb) and the <h1>
          (product crumb), pushing the gallery ~100px down. The JSON-LD twin
          still carries the whole trail, so search results are unaffected. */}
      {showBack ? (
        <Link href={storeHref(base, parent.path)} className="sf-mobile-only" style={back}>
          <Icon name="chevL" size={14} style={{ flex: "none" }} />
          <span style={backText}>{parent.name}</span>
        </Link>
      ) : null}
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

const back: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  maxWidth: "100%",
  fontSize: 13,
  color: "var(--muted)",
  // Same ≥40px tap target as the desktop crumbs, without extra visible height
  // (the page's top padding shrinks on phones to compensate).
  padding: "10px 0",
  marginLeft: -3,
};

/** One line, always — a long category name truncates rather than wraps. */
const backText: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
