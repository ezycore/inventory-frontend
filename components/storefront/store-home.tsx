"use client";
// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveSections, resolveTemplates } from "@/lib/storefront-templates";
import { configFor, sectionSignature } from "@/lib/storefront-sections";
import {
  padCampaignsForPreview,
  padForPreview,
  padStoreForPreview,
} from "@/lib/storefront-preview-samples";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { SECTION_COMPONENTS } from "@/components/storefront/home/home-sections";
import {
  HOME_PRESET_SECTIONS,
  isSectionId,
  type SectionId,
} from "@/lib/storefront-section-ids";

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
  rows,
  categories,
  campaigns,
}: {
  store: StorefrontStore;
  base: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  /**
   * Server-fetched products for the CONFIGURED sections, one entry per distinct
   * query. Keyed by signature rather than by section key so two sections asking
   * the catalogue the same thing share one fetch — and so a preview can match a
   * re-pointed row back to a render it already has.
   */
  rows?: { signature: string; items: CatalogProduct[] }[];
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
  const previewSectionConfig = useSfPreview((s) => s.sectionConfig);
  const previewActive = useSfPreview((s) => s.active);
  // Sent only by the Themes page; null in Customize, where the shop is real.
  const previewSamples = useSfPreview((s) => s.samples);
  const previewBanner = useSfPreviewImage("banner", store.banner);
  const resolved = resolveTemplates(store);
  const sectionConfig = previewSectionConfig ?? store.sectionConfig;

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

  // Per-section products. The server fetched one query per CONFIGURED section
  // (see `shop/page.tsx`); under preview a section the merchant just re-pointed
  // has no server render, so it is matched back by what it ASKS FOR rather than
  // by key — re-pointing a row keeps its key, and matching on key alone would
  // go on showing the old row's products under the new heading.
  const ssrBySignature = new Map(
    (rows ?? []).map((r) => [r.signature, r.items] as const),
  );
  const rowItems = new Map<string, typeof featured>();
  for (const section of sections) {
    const config = configFor(sectionConfig, section.key);
    if (!config) continue;
    rowItems.set(section.key, ssrBySignature.get(sectionSignature(config)) ?? []);
  }

  /* In the theme PREVIEW only, pad a thin catalogue so a grid can show its own
     shape. A shop with three products renders three cards in every theme, which
     is exactly when the choice is being made and least visible. Gated on the
     preview store's `active` flag, so a shopper never sees a placeholder. */
  const shared = {
    base,
    currency,
    featured: previewActive ? padForPreview(featured, previewSamples) : featured,
    latest: previewActive ? padForPreview(latest, previewSamples) : latest,
    categories: previewCategories ?? categories,
    campaigns: previewActive ? padCampaignsForPreview(campaigns) : campaigns,
    t,
    banner,
    heroSlides,
    heroBanner: previewHeroBanner ?? store.heroBanner,
    store: previewActive ? padStoreForPreview(store, previewSamples) : store,
  };

  return (
    <div>
      {sections.map((section) => {
        const Section = SECTION_COMPONENTS[section.type as SectionId];
        const config = configFor(sectionConfig, section.key);
        // Keyed by the INSTANCE key, not the type: a page may carry the same
        // section twice, and keying by type would collide the pair into one.
        // Not the index either — that re-mounts every section below a reorder.
        return (
          <Section
            key={section.key}
            {...shared}
            config={config}
            items={config ? rowItems.get(section.key) : undefined}
          />
        );
      })}
    </div>
  );
}
