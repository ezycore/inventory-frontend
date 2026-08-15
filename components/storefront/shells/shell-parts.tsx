"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  ContentPageLink,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CampaignStrip } from "@/components/storefront/campaign-strip";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreBottomNav } from "@/components/storefront/store-bottom-nav";
import { StoreFooter } from "@/components/storefront/store-footer";

/**
 * Everything both shells put on the page, so the difference between them is
 * only the SKELETON.
 *
 * A shell decides where the announcement, header, rail, content and footer sit
 * relative to one another. It does not decide what any of them are — a bug fixed
 * in the footer must not need fixing again in the shell that arranges it
 * differently.
 */
export interface ShellProps {
  slug: string;
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
  initialPages?: ContentPageLink[];
  initialCampaigns?: StoreCampaign[];
  /** Breadcrumb tail; empty on the home page. */
  crumb: string;
  announcement?: StorefrontStore["nav"] extends infer N
    ? N extends { announcement?: infer A }
      ? A
      : never
    : never;
  t: Dict;
  children: ReactNode;
}

export function ShellAnnouncement({ announcement, base, slug }: {
  announcement: ShellProps["announcement"];
  base: string;
  slug: string;
}) {
  return <AnnouncementBar announcement={announcement} base={base} slug={slug} />;
}

export function ShellHeader({
  slug,
  base,
  store,
  categories,
  hideCategoryRow,
}: Pick<ShellProps, "slug" | "base" | "store" | "categories"> & {
  /**
   * The `rail` shell lists every department down the left of every page, so a
   * header that ALSO carries a category row would print the same list twice on
   * the same screen. Suppressed rather than forbidden: a merchant may pair any
   * header with any shell, and the shell is the half that knows there is a rail.
   */
  hideCategoryRow?: boolean;
}) {
  return (
    <StoreHeader
      slug={slug}
      base={base}
      store={store}
      categories={categories}
      hideCategoryRow={hideCategoryRow}
    />
  );
}

export function ShellCampaignStrip({
  slug,
  base,
  store,
  initialCampaigns,
}: Pick<ShellProps, "slug" | "base" | "store" | "initialCampaigns">) {
  return (
    <CampaignStrip
      slug={slug}
      base={base}
      currency={store?.currency}
      initialCampaigns={initialCampaigns}
    />
  );
}

/** Home / <current page>. Renders nothing on the home page itself. */
export function ShellBreadcrumb({ crumb, base, t }: { crumb: string; base: string; t: Dict }) {
  if (!crumb) return null;
  return (
    <div
      className="sf-noprint"
      style={{
        maxWidth: "var(--maxw)",
        margin: "0 auto",
        width: "100%",
        padding: "5px var(--pad) 0",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12.5,
      }}
    >
      {/* Vertical padding (offset by the wrapper's reduced top padding) gives
          the only interactive crumb a tappable height. */}
      <Link href={storeHref(base)} style={{ color: "var(--muted)", padding: "9px 0" }}>
        {t.navHome}
      </Link>
      <span style={{ color: "var(--faint)" }}>/</span>
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{crumb}</span>
    </div>
  );
}

export function ShellFooter({
  slug,
  base,
  store,
  initialPages,
}: Pick<ShellProps, "slug" | "base" | "store" | "initialPages">) {
  return (
    <StoreFooter slug={slug} base={base} store={store} initialPages={initialPages} />
  );
}

export function ShellBottomNav({
  slug,
  base,
  store,
  categories,
}: Pick<ShellProps, "slug" | "base" | "store" | "categories">) {
  return (
    <StoreBottomNav slug={slug} base={base} store={store} categories={categories} />
  );
}
