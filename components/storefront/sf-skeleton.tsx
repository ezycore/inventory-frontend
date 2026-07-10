// coding-standard: maintained

/**
 * Product-card-shaped loading placeholder (shimmer via `.sf-skeleton` in
 * storefront.css). Drop a handful into the same grid the real cards use.
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
        <div className="sf-skeleton" style={{ height: 13, borderRadius: 6, width: "80%" }} />
        <div className="sf-skeleton" style={{ height: 13, borderRadius: 6, width: "45%" }} />
        <div className="sf-skeleton" style={{ height: 34, borderRadius: 7, marginTop: 4 }} />
      </div>
    </div>
  );
}
