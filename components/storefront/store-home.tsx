"use client";
// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Classic } from "@/components/storefront/home/home-classic";
import { HeroSplit } from "@/components/storefront/home/home-hero-split";
import { Minimal } from "@/components/storefront/home/home-minimal";

type TplName = "classic" | "hero-split" | "minimal";
const HOME_VARIANTS: readonly string[] = ["classic", "hero-split", "minimal"];

/**
 * Storefront homepage — renders one of three admin-selectable templates
 * (Classic / Hero Split / Minimal, in `components/storefront/home/`) from
 * `templates.home`, server-rendered for SEO. Live brand-colour preview is
 * handled globally by the shell (it reads the preview store), so the whole
 * page — not just this content — repaints.
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
  const previewCollections = useSfPreview((s) => s.collections);
  const resolved = resolveTemplates(store);
  const tpl = HOME_VARIANTS.includes(previewHome ?? "")
    ? (previewHome as TplName)
    : resolved.home;

  const banner = store.banner?.mediumUrl || store.banner?.url;
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
  };

  if (tpl === "hero-split") return <HeroSplit {...shared} />;
  if (tpl === "minimal") return <Minimal {...shared} />;
  return <Classic {...shared} />;
}
