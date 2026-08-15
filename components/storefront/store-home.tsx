"use client";
// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveSections, resolveTemplates } from "@/lib/storefront-templates";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import {
  HOME_PRESET_SECTIONS,
  SECTION_COMPONENTS,
  isSectionId,
  type SectionId,
} from "@/components/storefront/home/home-sections";

/**
 * Storefront homepage — **a list of sections, not a template.**
 *
 * Which sections and in what order comes from `resolveSections` (draft → the
 * merchant's saved `theme.homepageSections` → their `templates.home` default),
 * and each id resolves through the registry in `home/home-sections.tsx`. That is
 * what lets a theme produce a structurally different page rather than a
 * repainted one — see the note in that file before adding anything here.
 *
 * Server-rendered for SEO. Live brand-colour preview is handled globally by the
 * shell (it reads the preview store), so the whole page repaints, not just this.
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
  // Live drafts from the admin Customize editor (only set under ?preview=1).
  const previewHome = useSfPreview((s) => s.home);
  const previewSections = useSfPreview((s) => s.homepageSections);
  const previewSlides = useSfPreview((s) => s.heroSlides);
  const previewHeroSrc = useSfPreview((s) => s.heroSrc);
  const previewHeroBanner = useSfPreview((s) => s.heroBanner);
  const previewCollections = useSfPreview((s) => s.collections);
  const previewBanner = useSfPreviewImage("banner", store.banner);
  const resolved = resolveTemplates(store);

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

  // A drafted `templates.home` has to reach the resolver as the store's own
  // value, since the preset it selects IS the fallback section list — passing
  // only the saved store would leave the preview on the old composition.
  const previewStore = previewHome
    ? { ...store, templates: { ...store.templates, home: previewHome } }
    : store;
  const sections = resolveSections(previewStore, {
    draft: previewSections,
    isSectionId,
    presets: HOME_PRESET_SECTIONS,
  });

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
    store,
  };

  return (
    <div>
      {sections.map((section) => {
        const Section = SECTION_COMPONENTS[section.type as SectionId];
        // Keyed by the INSTANCE key, not the type: a page may carry the same
        // section twice, and keying by type would collide the pair into one.
        // Not the index either — that re-mounts every section below a reorder.
        return <Section key={section.key} {...shared} />;
      })}
    </div>
  );
}
