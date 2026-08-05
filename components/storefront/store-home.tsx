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
import {
  resolveHomeSections,
  type HomeVariant,
} from "@/lib/storefront-home-sections";
import { HOME_SECTION_COMPONENTS } from "@/components/storefront/home/home-sections";

const HOME_VARIANTS: readonly string[] = ["classic", "hero-split", "minimal"];

/**
 * Storefront homepage — an ordered list of sections, server-rendered for SEO.
 *
 * Two settings decide what renders. `theme.homepageSections` is the order (and
 * therefore which sections appear at all); `templates.home` is the styling
 * family every section renders in — the Classic / Hero Split / Minimal choice,
 * which used to select one of three whole-page components. A store with no
 * saved section list falls back to that variant's original order, so an
 * un-customized shop is unchanged.
 *
 * Live brand-colour preview is handled globally by the shell (it reads the
 * preview store), so the whole page — not just this content — repaints.
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
  // so picking Classic/Hero-Split/Minimal repaints the homepage instantly.
  const previewHome = useSfPreview((s) => s.home);
  const previewSlides = useSfPreview((s) => s.heroSlides);
  const previewHeroSrc = useSfPreview((s) => s.heroSrc);
  const previewHeroBanner = useSfPreview((s) => s.heroBanner);
  const previewCollections = useSfPreview((s) => s.collections);
  const previewSections = useSfPreview((s) => s.homepageSections);
  const previewBanner = useSfPreviewImage("banner", store.banner);
  const resolved = resolveTemplates(store);
  const variant: HomeVariant = HOME_VARIANTS.includes(previewHome ?? "")
    ? (previewHome as HomeVariant)
    : resolved.home;

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
    variant,
  };

  // `??`, not `||`: `null` means "the editor has not drafted an order", which is
  // the only case that should read the saved one. A drafted list is used as-is —
  // and if it is empty, `resolveHomeSections` lands on the look's default order
  // rather than rendering a blank shop (the editor also refuses to switch the
  // last section off, so empty should not arrive here in the first place).
  const sections = resolveHomeSections(
    previewSections ?? store.theme?.homepageSections,
    variant,
  );

  return (
    <div>
      {sections.map((id) => {
        const Section = HOME_SECTION_COMPONENTS[id];
        return <Section key={id} {...shared} />;
      })}
    </div>
  );
}
