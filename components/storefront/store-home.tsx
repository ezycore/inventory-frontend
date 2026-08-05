"use client";
// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { resolveHomeSections } from "@/lib/storefront-home-sections";
import { getHomeTemplate } from "@/components/storefront/home/templates/registry";

/**
 * Storefront homepage — a template's blocks, in the merchant's order.
 *
 * `templates.home` picks the template (which blocks exist and how each is
 * drawn); `theme.homepageSections` picks which of them render and in what
 * order. A store with no saved order gets the template's own, so an
 * un-customized shop is unchanged.
 *
 * Live brand-colour and design-token preview is handled globally by the shell,
 * so the whole page — not just this content — repaints as the merchant edits.
 */
export function StoreHome({
  store,
  base,
  featured,
  latest,
  categories,
  campaigns,
}: {
  store: StorefrontStore;
  base: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  categories: CatalogCategory[];
  campaigns: StoreCampaign[];
}) {
  const { t } = useStorefrontUI();
  const currency = store.currency;
  // Live draft from the admin Customize editor (only set under ?preview=1) wins,
  // so picking a template repaints the homepage instantly.
  const previewHome = useSfPreview((s) => s.home);
  const previewSlides = useSfPreview((s) => s.heroSlides);
  const previewHeroSrc = useSfPreview((s) => s.heroSrc);
  const previewHeroBanner = useSfPreview((s) => s.heroBanner);
  const previewCollections = useSfPreview((s) => s.collections);
  const previewSections = useSfPreview((s) => s.homepageSections);
  const previewBanner = useSfPreviewImage("banner", store.banner);
  const resolved = resolveTemplates(store);
  const template = getHomeTemplate(previewHome ?? resolved.home);

  const banner = previewBanner?.mediumUrl || previewBanner?.url;
  // Hero source (templates.hero): "banner" forces the static hero even when
  // slides exist; "slides" (default) shows the carousel when there are slides.
  const heroSrc =
    previewHeroSrc === "slides" || previewHeroSrc === "banner"
      ? previewHeroSrc
      : resolved.hero;
  const heroSlides =
    heroSrc === "banner" ? undefined : (previewSlides ?? store.heroSlides);
  // Category chips follow the Collections panel's unsaved draft under preview.
  // The admin's collection list carries no image, so re-attach each category's
  // own image by id — without this the chips would fall back to initial tiles
  // and the preview would misrepresent the real homepage.
  const previewCategories = previewCollections?.map((pc) => ({
    ...pc,
    image: pc.image ?? categories.find((c) => c._id === pc._id)?.image,
  }));

  const shared = {
    base,
    currency,
    featured,
    latest,
    categories: previewCategories ?? categories,
    campaigns,
    t,
    banner,
    heroSlides,
    heroBanner: previewHeroBanner ?? store.heroBanner,
    // Saved copy only — the trust and promo blocks resolve their own live
    // draft against it, the way the Rich footer does.
    trustBadges: store.trustBadges,
    promoTiles: store.promoTiles,
    variant: resolved.home,
  };

  // `??`, not `||`: `null` means "the editor has not drafted an order", the one
  // case that should read the saved one.
  const sections = resolveHomeSections(
    previewSections ?? store.theme?.homepageSections,
    { available: Object.keys(template.sections), defaultOrder: template.defaultOrder },
  );

  return (
    <div>
      {sections.map((id) => {
        const Section = template.sections[id];
        return Section ? <Section key={id} {...shared} /> : null;
      })}
    </div>
  );
}
