// coding-standard: maintained

import type { CSSProperties } from "react";

/**
 * Storefront loading placeholders. The shimmer itself is `.sf-skeleton` in
 * storefront.css — theme-aware, and stilled under `prefers-reduced-motion`.
 *
 * Prefer a placeholder shaped like the answer over a "Loading…" line: these
 * pages are opened on a phone over a slow connection, and a bare text line
 * gives the reader nothing to read and then reflows the whole page when the
 * data lands. Keep the bars decorative (`aria-hidden`) and let ONE
 * `role="status"` wrapper per screen carry the accessible name.
 */

/** One shimmer bar. `width` takes any CSS length or percentage. */
export function SkeletonLine({
  width = "100%",
  height = 13,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="sf-skeleton"
      aria-hidden
      style={{ width, height, borderRadius: radius, flex: "none", ...style }}
    />
  );
}

/**
 * Product-card-shaped loading placeholder. Drop a handful into the same grid the
 * real cards use.
 */
export function SkeletonCard() {
  return (
    <div
      aria-hidden
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div className="sf-skeleton" style={{ aspectRatio: "1 / 1" }} />
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonLine width="80%" />
        <SkeletonLine width="45%" />
        <SkeletonLine height={34} radius={7} style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}
