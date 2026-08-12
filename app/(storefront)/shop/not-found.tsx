// coding-standard: maintained
import Link from "next/link";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storeHref } from "@/lib/storefront-links";
import { adminUrlForDomain } from "@/lib/admin-url";

/**
 * Storefront 404. Renders inside `shop/layout.tsx`, so the shopper keeps the
 * store's header, nav and footer — a dead end with no way back is how you lose
 * the visit as well as the URL.
 *
 * The point of routing here (rather than rendering "not found" text inside the
 * view) is the **status code**: a missing product used to answer 200, which tells
 * a crawler the URL is a real page and fills Search Console with soft-404s.
 *
 * Two different 404s land here and they need different copy. A missing *page* on
 * a live store should offer the catalogue; a missing *store* has no catalogue to
 * offer, and the only person who can act on it is the owner — so that variant
 * carries the sign-in link instead. It used to be a 200 rendered by the layout.
 *
 * English only, like the rest of the server-rendered storefront chrome: the
 * language toggle is client-side (`localStorage`).
 */
export default async function StoreNotFound() {
  const { slug, base, origin } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;

  if (!store) return <StoreUnavailable base={base} origin={origin} />;

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "72px var(--pad) 96px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", margin: 0 }}>
        404
      </p>
      <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "10px 0 8px" }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 26px" }}>
        The link may be broken, or the item may no longer be available.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href={storeHref(base, "/products")}
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
            padding: "11px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Browse all products
        </Link>
        <Link
          href={storeHref(base)}
          style={{
            border: "1px solid var(--border-strong)",
            color: "var(--text)",
            padding: "11px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

/**
 * The host resolves to no published store. Rendered without the store chrome
 * (`shop/layout.tsx` skips `StoreShell` in this state) and behind a 404.
 *
 * The owner sign-in link appears **only on a custom domain**, where `base` is
 * `""` and the admin app is at `admin.<domain>`. On a tenant subdomain the admin
 * app is already at the root of the very host being visited, so a link would say
 * nothing — and pointing a shopper at an admin login is not an affordance.
 */
function StoreUnavailable({ base, origin }: { base: string; origin: string }) {
  const adminUrl = base === "" && origin ? adminUrlForDomain(origin) : "";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "72px var(--pad) 96px", textAlign: "center" }}>
      <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        Store unavailable
      </h1>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
        This store doesn&apos;t exist or isn&apos;t published yet.
      </p>
      {adminUrl ? (
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "26px 0 0" }}>
          Store owner?{" "}
          <a href={adminUrl} style={{ color: "var(--primary)", fontWeight: 600 }}>
            Sign in
          </a>
        </p>
      ) : null}
    </div>
  );
}
