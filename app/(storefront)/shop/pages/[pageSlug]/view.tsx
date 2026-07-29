"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { type CSSProperties } from "react";
import { useStorePage } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { ContentBodyView } from "@/components/storefront/content-body-view";
import type { ContentPageView } from "@/lib/storefront-client";

/**
 * CMS content page (About / FAQ / policies) — centered prose column rendering
 * the owner-authored body through the storefront markdown renderer.
 *
 * `initialPage` is server-fetched in `page.tsx` so the prose is in the SSR HTML.
 */
export default function StoreContentPage({
  initialPage,
}: {
  initialPage?: ContentPageView;
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const pageSlug = String(useParams().pageSlug);
  const {
    data: page,
    isLoading,
    isError,
  } = useStorePage(slug, pageSlug, initialPage);

  const wrapStyle: CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "30px var(--pad) 64px" };

  if (isLoading) {
    return <p style={{ ...wrapStyle, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>;
  }

  if (isError || !page) {
    return (
      <div style={{ ...wrapStyle, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "20px 0 10px" }}>{t.pageNotFound}</h1>
        <Link href={storeHref(base)} style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
          ← {t.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <article style={wrapStyle}>
      <header style={{ paddingBottom: 18, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          {page.title}
        </h1>
        {page.updatedAt ? (
          <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--faint)" }}>
            {t.lastUpdated}:{" "}
            {new Date(page.updatedAt).toLocaleDateString(t.langCode, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        ) : null}
      </header>
      <ContentBodyView body={page.body} />
    </article>
  );
}
