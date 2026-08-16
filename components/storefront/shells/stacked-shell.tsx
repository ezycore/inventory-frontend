"use client";
// coding-standard: maintained

import {
  ShellAnnouncement,
  ShellBreadcrumb,
  ShellCampaignStrip,
  ShellFooter,
  ShellHeader,
  type ShellProps,
} from "@/components/storefront/shells/shell-parts";

/**
 * Stacked — announcement, header, campaign strip, breadcrumb, content, footer,
 * top to bottom, every block full width.
 *
 * **The storefront's original skeleton, unchanged**, which is why it is the
 * default and why three of the four themes stamp it. Every header anatomy,
 * every home section and every page layout built so far lives inside this
 * `<main>` — this shell is the reason they all still read as one *kind* of
 * shop, and it is the right kind for most of them.
 */
export function StackedShell(props: ShellProps) {
  const { slug, base, store, categories, initialPages, initialCampaigns, crumb, announcement, t, children } = props;
  return (
    <>
      <ShellAnnouncement announcement={announcement} base={base} slug={slug} />
      <ShellHeader slug={slug} base={base} store={store} categories={categories} />
      <ShellCampaignStrip
        slug={slug}
        base={base}
        store={store}
        initialCampaigns={initialCampaigns}
      />
      <ShellBreadcrumb crumb={crumb} base={base} t={t} />
      <main style={{ flex: 1 }}>{children}</main>
      <ShellFooter slug={slug} base={base} store={store} initialPages={initialPages} />
    </>
  );
}
