// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { HeroCtaLink } from "@/components/storefront/home/hero-links";
import {
  HeroActions,
  HeroCardView,
  HeroOpenView,
  heroPrimaryButton,
  type HeroPhoto,
} from "@/components/storefront/home/hero-static";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["hero"];
type SlideBlock = { id: string; settings: SettingsOf<Spec["blocks"]["settings"]> };

/**
 * The blocks as the storefront's hero slides. A slide with neither a photo nor
 * any text is left out — the home hero's slide validator refuses one.
 */
export function heroSlides(blocks: readonly SlideBlock[]): StoreHeroSlide[] {
  return blocks.flatMap(({ settings }) => {
    const hasText = [settings.badge, settings.title, settings.subtitle, settings.buttonLabel].some(
      (text) => !!text?.trim(),
    );
    if (!settings.image && !settings.mobileImage && !hasText) return [];
    return [
      {
        image: settings.image,
        mobileImage: settings.mobileImage,
        focal: settings.focal?.base,
        mobileFocal: settings.focal?.mobile,
        imageFit: settings.imageFit,
        badge: settings.badge,
        title: settings.title,
        subtitle: settings.subtitle,
        buttonLabel: settings.buttonLabel,
        link: settings.link,
        hideTextOnMobile: settings.hideTextOnMobile,
      },
    ];
  });
}

/** A single slide's photo for the static heroes; unset fit shows the whole photo, as a slide always has. */
const slidePhoto = (slide: StoreHeroSlide): HeroPhoto | undefined => {
  const image = slide.image ?? slide.mobileImage;
  const src = image?.url || image?.mediumUrl;
  if (!src) return undefined;
  return {
    src,
    mobileSrc: slide.mobileImage?.mediumUrl || slide.mobileImage?.url,
    fit: isImageFit(slide.imageFit) ? mediaFitFor(slide.imageFit) : "canvas",
    focal: focalPosition(slide.focal),
    mobileFocal: focalPosition(slide.mobileFocal || slide.focal),
  };
};

/**
 * The page's hero: framed (`card`), on the page itself (`open`) or edge to edge
 * (`full-bleed`), with slides as blocks.
 *
 * One `card` or `open` slide is server markup — no JavaScript between the
 * shopper and the page's likely LCP image. More than one rotates in the
 * storefront's `HeroCarousel`, and `full-bleed` is always its own island; both
 * keep the home heroes' timing, swipe and pause rules. Every word is the
 * merchant's: a slide without a title keeps the store's name as a hidden
 * heading, and a button needs both a label and a link.
 */
export function HeroSection({
  settings,
  blocks,
  context,
}: SectionViewProps<Spec["settings"], Spec["blocks"]["settings"]>) {
  const slides = heroSlides(blocks);
  if (slides.length === 0) return null;
  const storeName = context.storeName ?? "";

  if (settings.layout === "full-bleed") {
    return <Island name="hero-fullbleed" props={{ base: context.base, slides, storeName }} />;
  }
  if (slides.length > 1) {
    return <Island name="hero-carousel" props={{ base: context.base, slides, storeName, bare: true }} />;
  }

  const [slide] = slides;
  const title = slide.title?.trim();
  const align = settings.layout === "open" ? (settings.align ?? "left") : "left";
  const actions =
    slide.buttonLabel?.trim() && slide.link ? (
      <HeroActions align={align}>
        <HeroCtaLink base={context.base} link={slide.link} style={heroPrimaryButton}>
          {slide.buttonLabel}
        </HeroCtaLink>
      </HeroActions>
    ) : null;
  const copy = {
    badge: slide.badge?.trim() || undefined,
    title: title || storeName,
    hideTitle: !title,
    subtitle: slide.subtitle?.trim() || undefined,
    actions,
    photo: slidePhoto(slide),
  };
  return settings.layout === "open" ? (
    <HeroOpenView {...copy} align={align} />
  ) : (
    <HeroCardView {...copy} />
  );
}
