// coding-standard: maintained

/**
 * Centered loading spinner for page-level waits (persisted-store hydration,
 * redirects in flight) — the storefront twin of the admin layout's Loader2
 * splash. Keep pre-hydration renders NEUTRAL: never guest UI (see skill).
 */
export function LoadingSplash({ minHeight = 320 }: { minHeight?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight,
      }}
    >
      <span className="sf-spin" aria-hidden />
    </div>
  );
}
