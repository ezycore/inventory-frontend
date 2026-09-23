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
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import type { FooterProps } from "@/components/storefront/footer/footer-pieces";
import {
  ColumnsFooter,
  ContactFooter,
  NewsletterFooter,
  RichFooter,
  SimpleFooter,
} from "@/components/storefront/footer/footer-variants";
import { logoImageUrl } from "@/lib/storefront-image";

const FOOTER_VARIANTS: readonly string[] = [
  "columns",
  "simple",
  "rich",
  "contact",
  "newsletter",
];

/**
 * Storefront footer — renders one of five admin-selectable variants from
 * `templates.footer`. Reads the live preview override (admin Customize editor)
 * first so switching repaints instantly, the same way the home template does.
 *
 * Every string a variant renders arrives through `props` below and is either the
 * merchant's own setting or a localized default — see `FooterProps`. The variant
 * bodies live in `footer/`; the shared columned body and the closing bar live in
 * `footer/footer-pieces.tsx`.
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
  const previewGroups = useSfPreview((s) => s.footerGroups);
  const previewFooterPaymentMethods = useSfPreview(
    (s) => s.footerPaymentMethods,
  );
  const previewContentPages = useSfPreview((s) => s.footerContentPages);
  // Copy drafts. `??` and not `||` throughout: an empty string is a real draft
  // ("cleared, so fall back to the localized default"), and `||` would serve the
  // saved value back — which reads as the field refusing to clear.
  const previewText = useSfPreview((s) => s.footerText);
  const previewNote = useSfPreview((s) => s.footerNote);
  const previewContactHeading = useSfPreview((s) => s.footerContactHeading);
  const previewNewsletter = useSfPreview((s) => s.footerNewsletter);
  const logo = useSfPreviewImage("logo", store?.logo);

  const variant: StoreTemplates["footer"] = FOOTER_VARIANTS.includes(
    previewFooter ?? "",
  )
    ? (previewFooter as StoreTemplates["footer"])
    : resolveTemplates(store).footer;

  const props: FooterProps = {
    base,
    slug,
    store,
    t,
    name: store?.name ?? "Store",
    logo: logoImageUrl(logo),
    phone: store?.contact?.phone ?? "",
    // Draft groups win — an empty array is a real draft ("all groups removed"),
    // so this must not collapse to the saved value on falsiness.
    footerGroups: previewGroups ?? store?.nav?.footer ?? [],
    footerPaymentMethods:
      previewFooterPaymentMethods ?? store?.nav?.footerPaymentMethods,
    footerContentPages: previewContentPages ?? store?.nav?.footerContentPages,
    // The footer's own column, so the pages the merchant kept OUT of it are
    // dropped here rather than at the source: the same list is what the checkout
    // resolves its terms page against.
    infoPages: (pages ?? []).filter((page) => page.footer !== false),
    // Drafted-empty must reach the localized default, not the saved text — so
    // the `??` picks the source and the `||` applies the fallback, in that order.
    // `store.copy`, not `store.theme` — merchant-written wording is a sibling of
    // the theme so a ready-made theme can replace the look without erasing it.
    blurb: (previewText ?? store?.copy?.footerText)?.trim() || t.storeInfo,
    note: previewNote ?? store?.copy?.footerNote,
    contactHeading: previewContactHeading ?? store?.copy?.footerContactHeading,
    newsletter: previewNewsletter ?? store?.copy?.footerNewsletter,
  };

  if (variant === "simple") return <SimpleFooter {...props} />;
  if (variant === "rich") return <RichFooter {...props} />;
  if (variant === "contact") return <ContactFooter {...props} />;
  if (variant === "newsletter") return <NewsletterFooter {...props} />;
  return <ColumnsFooter {...props} />;
}
