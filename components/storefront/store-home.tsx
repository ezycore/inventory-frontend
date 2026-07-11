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
  const tpl = HOME_VARIANTS.includes(previewHome ?? "")
    ? (previewHome as TplName)
    : resolveTemplates(store).home;

  const banner = store.banner?.mediumUrl || store.banner?.url;
  const heroSlides = previewSlides ?? store.heroSlides;
  const shared = {
    base,
    currency,
    featured,
    latest,
    categories,
    campaigns,
    t,
    banner,
    heroSlides,
  };

  if (tpl === "hero-split") return <HeroSplit {...shared} />;
  if (tpl === "minimal") return <Minimal {...shared} />;
  return <Classic {...shared} />;
}
