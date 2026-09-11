"use client";
// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StoreTag,
  StorefrontStore,
} from "@/lib/storefront-client";
import {
  resolveHeroAlign,
  resolveSections,
  resolveTemplates,
} from "@/lib/storefront-templates";
import { configFor, sectionSignature } from "@/lib/storefront-sections";
import { stripVisibilityClass } from "@/lib/storefront-strip-display";
import {
  padCampaignsForPreview,
  padForPreview,
  padStoreForPreview,
  padTagsForPreview,
} from "@/lib/storefront-preview-samples";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { SECTION_COMPONENTS } from "@/components/storefront/home/home-sections";
import { sfVisuallyHidden } from "@/components/storefront/field-styles";
import {
  HOME_PRESET_SECTIONS,
  isSectionId,
  resolveHomePrimaryHeading,
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
  tags,
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
  tags?: StoreTag[];
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
  const previewHeroAlign = useSfPreview((s) => s.heroAlign);
  // Sent only by the Themes page; null in Customize, where the shop is real —
  // and null is what switches the padding below off. See the note there.
  const previewSamples = useSfPreview((s) => s.samples);
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
  // The config comes back OUT of the resolver, folded over whatever the preset
  // implies — a shop still on a default composition has configured rows it
  // never typed, and reading the stored list alone would render them bare.
  const { sections, config: sectionConfig } = resolveSections(previewStore, {
    draft: previewSections,
    sectionConfig: previewSectionConfig ?? store.sectionConfig,
    isSectionId,
    presets: HOME_PRESET_SECTIONS,
  });
  const primaryHeading = resolveHomePrimaryHeading(sections);

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

  /* On the THEME PICKER only, pad a thin catalogue so a grid can show its own
     shape. A shop with three products renders three cards in every theme, which
     is exactly when the choice is being made and least visible.

     ⚠ The gate is `previewSamples` being non-null — NOT the preview store's
     `active` flag. `active` is true for the Customize editor's iframe too, and
     for anyone who appends `?preview=1` to a live shop, so gating on it put
     invented products and a fabricated campaign in front of both. Only the
     Themes page sends samples; everywhere else these four calls return their
     input untouched. */
  const shared = {
    base,
    currency,
    featured: padForPreview(featured, previewSamples),
    latest: padForPreview(latest, previewSamples),
    categories: previewCategories ?? categories,
    tags: padTagsForPreview(tags ?? [], previewSamples),
    campaigns: padCampaignsForPreview(campaigns, previewSamples),
    t,
    banner,
    heroSlides,
    heroBanner: previewHeroBanner ?? store.heroBanner,
    store: padStoreForPreview(store, previewSamples),
    // Resolved ONCE here rather than inside the hero, so the section never sees
    // a raw stored id and the Customize draft reaches it the same way every
    // other look does. Only `hero-open` reads it.
    heroAlign: resolveHeroAlign(previewHeroAlign ?? store.theme?.heroAlign),
    // Classic's chips have always scrolled; photo/disc themes have always used
    // a grid. Preserve that look until the merchant explicitly chooses a mode.
    categoryRowDefault: sections.some((section) => section.type === "category-tiles")
      ? "grid" as const
      : "strip" as const,
  };

  return (
    <div>
      {primaryHeading.useHiddenStoreName ? (
        <h1 style={sfVisuallyHidden}>{store.name}</h1>
      ) : null}
      {sections.map((section) => {
        const Section = SECTION_COMPONENTS[section.type as SectionId];
        const config = configFor(sectionConfig, section.key);
        /* Per-breakpoint visibility, as a CLASS — the same pair the
           announcement bar and the campaign strip already use, and for the same
           reason: this page is server-rendered, so a `matchMedia` check would
           paint the wrong state and correct it after hydration.

           The wrapper only exists when the merchant has actually hidden the
           section somewhere. `undefined` is the overwhelming majority, and a
           div around every section would change the DOM of every shop to
           express "shown everywhere", which is what no wrapper already says. */
        const hidden = stripVisibilityClass(
          section.showOnDesktop,
          section.showOnMobile,
        );
        // Keyed by the INSTANCE key, not the type: a page may carry the same
        // section twice, and keying by type would collide the pair into one.
        // Not the index either — that re-mounts every section below a reorder.
        const rendered = (
          <Section
            key={section.key}
            {...shared}
            primaryHeading={primaryHeading.editorialKey === section.key}
            config={config}
            items={config ? rowItems.get(section.key) : undefined}
          />
        );
        return hidden ? (
          <div key={section.key} className={hidden}>
            {rendered}
          </div>
        ) : (
          rendered
        );
      })}
    </div>
  );
}
