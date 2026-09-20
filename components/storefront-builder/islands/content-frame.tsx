"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ContentBodyView } from "@/components/storefront/content-body-view";
import { ContentFrame } from "@/components/storefront/content-frame";

/**
 * A content page as the storefront has always drawn it — the theme's content
 * frame around the merchant's body — for a page that now lives on the builder.
 * The same components the Content screen's pages render through, so a moved page
 * is the same page.
 *
 * The wrapper class is what lets the section's frame drop its side padding
 * (`storefront-builder.css`); the content frame brings its own.
 */
export function ContentFrameIsland({
  title,
  body,
  updatedAt,
  layout,
}: {
  title: string;
  body: string;
  updatedAt?: string;
  /** The section's own frame; unset follows the store's `templates.contentLayout`. */
  layout?: string;
}) {
  const { t } = useStorefrontUI();
  const meta = updatedAt
    ? `${t.lastUpdated}: ${new Date(updatedAt).toLocaleDateString(t.langCode, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`
    : undefined;
  return (
    <div className="sfb-content-frame">
      <ContentFrame title={title} meta={meta} layout={layout}>
        <ContentBodyView body={body} />
      </ContentFrame>
    </div>
  );
}
