// coding-standard: maintained
import type { ReactNode } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { StoreCampaign, StoreHeroSlide, StorefrontImage } from "@/lib/storefront-client";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { money } from "@/components/storefront/format";
import { HeroCtaLink } from "@/components/storefront/home/hero-links";
import {
  HeroActions,
  HeroCardView,
  HeroOpenView,
  heroPrimaryButton,
  heroSecondaryButton,
  type HeroPhoto,
} from "@/components/storefront/home/hero-static";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["hero"];
type Settings = SettingsOf<Spec["settings"]>;
type SlideBlock = { id: string; settings: SettingsOf<Spec["blocks"]["settings"]> };

/**
 * A hero moved from the classic home draws its banner hero from the first slide
 * even when that slide is empty — the home page showed the store's name and
 * banner there — so an empty slide counts only when the hero keeps the store's
 * banner or wording.
 */
export const keepsEmptySlides = (settings: Pick<Settings, "storeBanner" | "storeWords">): boolean =>
  !!(settings.storeBanner || settings.storeWords);

/**
 * The blocks as the storefront's hero slides. A slide with neither a photo nor
 * any text is left out — the home hero's slide validator refuses one — unless
 * `keepEmpty` (`keepsEmptySlides`).
 */
export function heroSlides(blocks: readonly SlideBlock[], keepEmpty = false): StoreHeroSlide[] {
  return blocks.flatMap(({ settings }) => {
    const hasText = [settings.badge, settings.title, settings.subtitle, settings.buttonLabel].some(
      (text) => !!text?.trim(),
    );
    if (!keepEmpty && !settings.image && !settings.mobileImage && !hasText) return [];
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

const imageSrc = (image: StorefrontImage | null | undefined) => image?.mediumUrl || image?.url;

/**
 * A single slide's photo for the static heroes — the store banner in its place
 * when the hero uses it. Unset fit shows the whole photo, as a slide and the
 * banner always have.
 */
const slidePhoto = (slide: StoreHeroSlide, banner?: StorefrontImage | null): HeroPhoto | undefined => {
  const src = imageSrc(slide.image) || imageSrc(banner) || imageSrc(slide.mobileImage);
  if (!src) return undefined;
  return {
    src,
    mobileSrc: imageSrc(slide.mobileImage),
    fit: isImageFit(slide.imageFit) ? mediaFitFor(slide.imageFit) : "canvas",
    focal: focalPosition(slide.focal),
    mobileFocal: focalPosition(slide.mobileFocal || slide.focal),
  };
};

const storeWord = (word: "shopNow" | "browseCats" | "campaignOff") => (
  <Island name="store-word" props={{ word }} />
);

/** The running offer as the classic home hero names it: "Eid sale · 10% off". */
function campaignBadge(campaigns: StoreCampaign[], currency?: string): ReactNode {
  const campaign = campaigns.find((c) => c.scope === "storewide") ?? campaigns[0];
  if (!campaign) return undefined;
  const amount = campaign.type === "percentage" ? `${campaign.value}%` : money(campaign.value, currency);
  return (
    <>
      {`${campaign.name} · ${amount} `}
      {storeWord("campaignOff")}
    </>
  );
}

/**
 * The page's hero: framed (`card`), on the page itself (`open`) or edge to edge
 * (`full-bleed`), with slides as blocks.
 *
 * One `card` or `open` slide is server markup — no JavaScript between the
 * shopper and the page's likely LCP image. More than one rotates in the
 * storefront's `HeroCarousel` (so does one, under `slideshow`), and `full-bleed`
 * is always an island; both keep the home heroes' timing, swipe and pause rules.
 *
 * By default every word is the merchant's: a slide without a title keeps the
 * store's name as a hidden heading, and a button needs both a label and a link.
 * A hero moved from the classic home keeps that page's banner hero instead —
 * see the `hero` settings in `section-specs.ts`.
 */
export function HeroSection({
  settings,
  blocks,
  context,
}: SectionViewProps<Spec["settings"], Spec["blocks"]["settings"]>) {
  const slides = heroSlides(blocks, keepsEmptySlides(settings));
  if (slides.length === 0) return null;
  const storeName = context.storeName ?? "";
  const [slide] = slides;
  const first = blocks[0]?.settings;

  if (settings.layout === "full-bleed") {
    if (!settings.storeBanner) {
      return <Island name="hero-fullbleed" props={{ base: context.base, slides, storeName }} />;
    }
    return (
      <Island
        name="hero-fullbleed-store"
        props={{
          base: context.base,
          storeName,
          storeWords: !!settings.storeWords,
          fallback: {
            image: slide.image ?? context.banner ?? slide.mobileImage,
            mobileImage: slide.mobileImage,
            // The banner always cropped here before its fit control existed.
            fit: isImageFit(slide.imageFit) ? mediaFitFor(slide.imageFit) : "cover",
            focal: focalPosition(slide.focal),
            mobileFocal: focalPosition(slide.mobileFocal || slide.focal),
            badge: slide.badge?.trim(),
            title: slide.title?.trim() || storeName,
            subtitle: slide.subtitle?.trim(),
            ctaLabel: slide.buttonLabel?.trim(),
            link: slide.link,
          },
        }}
      />
    );
  }
  if (settings.slideshow || slides.length > 1) {
    return <Island name="hero-carousel" props={{ base: context.base, slides, storeName, bare: true }} />;
  }

  const title = slide.title?.trim();
  const align = settings.layout === "open" ? (settings.align ?? "left") : "left";
  const secondaryLabel = first?.secondaryLabel?.trim();
  const secondaryLink = first?.secondaryLink;
  let actions: ReactNode = null;
  if (settings.storeWords) {
    // The classic banner hero's pair: both buttons always, the catalogue where no link is set.
    actions = (
      <HeroActions align={align}>
        <HeroCtaLink base={context.base} link={slide.link} style={heroPrimaryButton}>
          {slide.buttonLabel?.trim() || storeWord("shopNow")}
        </HeroCtaLink>
        <HeroCtaLink base={context.base} link={secondaryLink} style={heroSecondaryButton}>
          {secondaryLabel || storeWord("browseCats")}
        </HeroCtaLink>
      </HeroActions>
    );
  } else {
    const primary = slide.buttonLabel?.trim() && slide.link;
    const secondary = secondaryLabel && secondaryLink;
    if (primary || secondary) {
      actions = (
        <HeroActions align={align}>
          {primary ? (
            <HeroCtaLink base={context.base} link={slide.link} style={heroPrimaryButton}>
              {slide.buttonLabel}
            </HeroCtaLink>
          ) : null}
          {secondary ? (
            <HeroCtaLink base={context.base} link={secondaryLink} style={heroSecondaryButton}>
              {secondaryLabel}
            </HeroCtaLink>
          ) : null}
        </HeroActions>
      );
    }
  }

  const copy = {
    badge:
      slide.badge?.trim() ||
      (settings.campaignBadge ? campaignBadge(context.campaigns ?? [], context.currency) : undefined),
    title: title || storeName,
    hideTitle: !title && !settings.storeWords,
    subtitle: slide.subtitle?.trim() || undefined,
    actions,
    photo: slidePhoto(slide, settings.storeBanner ? context.banner : undefined),
  };
  return settings.layout === "open" ? (
    <HeroOpenView {...copy} align={align} />
  ) : (
    <HeroCardView {...copy} promises={settings.promises ? (context.promises ?? []) : []} />
  );
}
