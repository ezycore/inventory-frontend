"use client";
// coding-standard: maintained

import type {
  ContentPageLink,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { useStorePages } from "@/services/storefront/hooks";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import type { FooterProps } from "@/components/storefront/footer/footer-pieces";
import {
  ColumnsFooter,
  RichFooter,
  SimpleFooter,
} from "@/components/storefront/footer/footer-variants";

const FOOTER_VARIANTS: readonly string[] = ["columns", "simple", "rich"];

/**
 * Storefront footer — renders one of three admin-selectable variants
 * (Columns / Simple / Rich) from `templates.footer`. Reads the live preview
 * override (admin Customize editor) first so switching repaints instantly, the
 * same way the home template does. Each footer group renders as its own column;
 * the auto content-pages column ("Information") is shown/renamed via
 * `nav.footerContentPages`. The variant bodies live in `footer/`.
 */
export function StoreFooter({
  slug,
  base,
  store,
  initialPages,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
  initialPages?: ContentPageLink[];
}) {
  const { t } = useStorefrontUI();
  const { data: pages } = useStorePages(slug, initialPages);
  const previewFooter = useSfPreview((s) => s.footer);

  const variant: StoreTemplates["footer"] = FOOTER_VARIANTS.includes(
    previewFooter ?? "",
  )
    ? (previewFooter as StoreTemplates["footer"])
    : resolveTemplates(store).footer;

  const props: FooterProps = {
    base,
    store,
    t,
    name: store?.name ?? "Store",
    logo: store?.logo?.url || store?.logo?.thumbnailUrl,
    phone: store?.contact?.phone ?? "",
    footerGroups: store?.nav?.footer ?? [],
    footerContentPages: store?.nav?.footerContentPages,
    infoPages: pages ?? [],
  };

  if (variant === "simple") return <SimpleFooter {...props} />;
  if (variant === "rich") return <RichFooter {...props} />;
  return <ColumnsFooter {...props} />;
}
