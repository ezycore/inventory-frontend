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
import { ContentFrame } from "@/components/storefront/content-frame";
import { SkeletonLine } from "@/components/storefront/sf-skeleton";
import type { ContentPageView } from "@/lib/storefront-client";

/**
 * CMS content page (About / FAQ / policies) — centered prose column rendering
 * the owner-authored body through the storefront markdown renderer.
 *
 * `initialPage` is server-fetched by the route so the prose is in the SSR HTML.
 * Two routes render it: the cached `sites/…/pages/[pageSlug]` for shoppers, and
 * `shop/pages/[pageSlug]` for owner preview and hosts that name no store. Both
 * name the slug param `pageSlug`, which is what `useParams` reads below.
 */
export function StoreContentPage({
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

  // Prose-shaped, because that is what lands here: a title, the meta rule, then
  // paragraphs. Ragged line widths so it reads as text rather than as a table.
  if (isLoading) {
    return (
      <div style={wrapStyle} role="status" aria-label={t.loading}>
        <div style={{ paddingBottom: 18, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <SkeletonLine width="62%" height={30} radius={8} />
          <SkeletonLine width={140} height={11} style={{ marginTop: 12 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {["100%", "96%", "88%", "52%"].map((w, i) => (
            <SkeletonLine key={i} width={w} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 26 }}>
          {["94%", "100%", "72%"].map((w, i) => (
            <SkeletonLine key={i} width={w} />
          ))}
        </div>
      </div>
    );
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

  // The FRAME is the theme's (four of them, see ContentFrame); the body is
  // always the merchant's markdown through the one renderer.
  return (
    <ContentFrame
      title={page.title}
      meta={
        page.updatedAt
          ? `${t.lastUpdated}: ${new Date(page.updatedAt).toLocaleDateString(t.langCode, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}`
          : undefined
      }
    >
      <ContentBodyView body={page.body} />
    </ContentFrame>
  );
}
