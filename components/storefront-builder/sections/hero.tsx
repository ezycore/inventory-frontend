// coding-standard: maintained
import type { ReactNode } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { StoreCampaign, StoreHeroSlide, StorefrontImage } from "@/lib/storefront-client";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { ASPECT_RATIOS, ASPECT_RATIO_PADDING } from "@/lib/storefront-builder/aspect-ratios";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { money } from "@/components/storefront/format";
import { HeroCtaLink, HeroSlideLink } from "@/components/storefront/home/hero-links";
import {
  HeroActions,
  HeroCardView,
  HeroOpenView,
  heroPrimaryButton,
  heroSecondaryButton,
  heroSlidePhoto,
  type HeroFrame,
  type HeroPlacement,
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
        secondaryLabel: settings.secondaryLabel,
        secondaryLink: settings.secondaryLink,
      },
    ];
  });
}

/**
 * The hero's chosen shape, as the pair every framed builder section carries: the
 * custom properties hold the ratio, and `base`/`mobile` say a ratio EXISTS,
 * which each view turns into `data-frame` / `data-frame-m`.
 *
 * Both halves, because CSS cannot ask whether a custom property was set, and two
 * rules depend on the answer — the full-bleed hero's `min-height` floor has to be
 * lifted only where a shape replaces it (a floor beats an `aspect-ratio`, so
 * 21:9 on a 390px phone would otherwise compute 167px, be floored straight back
 * to 260px, and show the merchant nothing), and a phone-only shape must not also
 * crop the desktop.
 *
 * `image-banner` and `gallery` carry the same pair for the same reason. Plain
 * data throughout, so it crosses an island boundary unchanged.
 */
function heroFrame(settings: Pick<Settings, "frame" | "height">): HeroFrame | undefined {
  const frame = settings.frame;
  const height = settings.height;
  // Either answers the hero's box, so either is enough to build the object —
  // a height with no shape still needs its variables and attributes through.
  if (!frame?.base && !frame?.mobile && height?.base === undefined && height?.mobile === undefined) {
    return undefined;
  }
  return {
    vars: {
      ...responsiveVars("sfb-hero-h", height, (px) => `${px}px`),
      ...responsiveVars("sfb-hero-frame", frame, (ratio) => ASPECT_RATIOS[ratio]),
      /* The same shape as a percentage, for the ONE layout that cannot use
         `aspect-ratio`: a full-width hero's words sit on the photograph, so its
         box has to be able to grow past the shape rather than clip them. See
         `ASPECT_RATIO_PADDING`. */
      ...responsiveVars("sfb-hero-pad", frame, (ratio) => ASPECT_RATIO_PADDING[ratio]),
    },
    base: !!frame?.base,
    mobile: !!frame?.mobile,
    heightBase: height?.base !== undefined,
    heightMobile: height?.mobile !== undefined,
  };
}

const storeWord = (word: "shopNow" | "browseCats" | "campaignOff") => (
  <Island name="store-word" props={{ word }} />
);

const endsAtMs = (campaign: StoreCampaign): number => {
  const ms = campaign.endsAt ? Date.parse(campaign.endsAt) : Number.NaN;
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
};

/**
 * Which running offer the badge names. `campaigns` holds only the RUNNING ones,
 * so a picked id that is missing from it has ended or not started — and names
 * nothing, rather than an offer the merchant did not choose. Unpicked, the
 * storewide offer leads, then the one ending soonest: with several running,
 * "whichever the API listed first" was a badge nobody could predict.
 */
export function pickCampaign(
  campaigns: readonly StoreCampaign[],
  campaignId?: string,
): StoreCampaign | undefined {
  if (campaignId) return campaigns.find((c) => c._id === campaignId);
  return [...campaigns].sort(
    (a, b) =>
      Number(b.scope === "storewide") - Number(a.scope === "storewide") || endsAtMs(a) - endsAtMs(b),
  )[0];
}

/**
 * The running offer as the classic home hero names it, without its last word:
 * "Eid sale · 10%". The word "off" is the shopper's, so a server view cannot
 * hold it — the text and the word are joined by whoever can (`campaignBadge`
 * here, `HeroSlidesView` in the rotating hero, which has the dictionary).
 */
function campaignLabel(
  campaigns: StoreCampaign[],
  campaignId: string | undefined,
  currency?: string,
): string | undefined {
  const campaign = pickCampaign(campaigns, campaignId);
  if (!campaign) return undefined;
  const amount = campaign.type === "percentage" ? `${campaign.value}%` : money(campaign.value, currency);
  return `${campaign.name} · ${amount}`;
}

/** The running offer as a badge: "Eid sale · 10% off". */
function campaignBadge(
  campaigns: StoreCampaign[],
  campaignId: string | undefined,
  currency?: string,
): ReactNode {
  const label = campaignLabel(campaigns, campaignId, currency);
  if (!label) return undefined;
  return (
    <>
      {`${label} `}
      {storeWord("campaignOff")}
    </>
  );
}

/**
 * The page's hero: framed (`card`), on the page itself (`open`) or edge to edge
 * (`full-bleed`), with slides as blocks.
 *
 * One `card` or `open` slide is server markup — no JavaScript between the
 * shopper and the page's likely LCP image. More than one rotates in
 * `HeroSlidesView`, in the same shape (so does one, under `slideshow`), and
 * `full-bleed` is always an island; both keep the home heroes' timing, swipe and
 * pause rules.
 *
 * By default every word is the merchant's: a slide without a title keeps the
 * store's name as a hidden heading, and a button needs only a label — an empty
 * link is the catalogue, which is `HeroCtaLink`'s own rule.
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
  /* Every layout, not just `open`. The control was offered on all three and
     moved nothing on two of them (plan phase 4). */
  const align = settings.align ?? "left";
  /* Full-bleed only — the other two layouts show every word on a phone already,
     and `field-visibility.ts` hides the control there. Passed as the merchant's
     value or not at all, so the classic home's own callers stay attribute-free. */
  const mobileCopy = settings.mobileCopy;
  const frame = heroFrame(settings);
  /* Card and open only — a full-bleed hero's picture is its background, and
     `field-visibility.ts` hides both controls there. Undefined rather than a
     resolved default, so a hero nobody placed sets no attribute at all and the
     stylesheet keeps drawing what it always drew. */
  /* Every rotating hero's, whatever its layout: what the shopper moves the
     slides with, and how long each one holds. Passed as the merchant's value or
     not at all, so a hero nobody has touched runs the 5s beat with dots. */
  const nav = settings.nav;
  const interval = settings.interval;
  const placement: HeroPlacement | undefined =
    settings.imageSide || settings.mobileFirst
      ? { side: settings.imageSide, mobileFirst: settings.mobileFirst }
      : undefined;

  if (settings.layout === "full-bleed") {
    if (!settings.storeBanner) {
      return (
        <Island
          name="hero-fullbleed"
          props={{ base: context.base, slides, storeName, align, mobileCopy, frame, nav, interval }}
        />
      );
    }
    return (
      <Island
        name="hero-fullbleed-store"
        props={{
          base: context.base,
          storeName,
          storeWords: !!settings.storeWords,
          align,
          mobileCopy,
          frame,
          nav,
          interval,
          slides,
          /* The store banner, and nothing else. The view reaches for it only
             where a slide has no artwork of its own, which is what "Use the
             store banner" means; the copy all rides on the slides now. The
             banner has always been cropped — it predates the fit control and
             has no control of its own — so it keeps `cover` rather than
             borrowing whichever fit slide 1 happens to carry. Slide 1's focus
             point is the only aim this picture is ever given, and it is the
             same picture on every slide that falls back to it. */
          fallback: {
            image: context.banner,
            fit: "cover",
            focal: focalPosition(slide.focal),
            mobileFocal: focalPosition(slide.mobileFocal || slide.focal),
          },
        }}
      />
    );
  }
  /* Rotating, and STILL a card or still open. A dark, edge-to-edge photo
     carousel used to take over here, so a merchant who chose Card and added a
     slide silently got a different section (plan phase 3).

     `settings.slideshow` is NOT read: a single slide has nothing to rotate to,
     so under it this island drew one motionless slide with no dots — the same
     picture the static branch draws, only client-rendered, which cost the LCP
     image its server markup and gave the merchant nothing. The toggle is
     hidden for the same reason (`field-visibility.ts`). It once meant
     something, when one slide under it became the dark carousel. */
  if (slides.length > 1) {
    return (
      <Island
        name="hero-slides"
        props={{
          base: context.base,
          slides,
          storeName,
          layout: settings.layout === "open" ? "open" : "card",
          align,
          frame,
          placement,
          banner: settings.storeBanner ? context.banner : undefined,
          storeWords: !!settings.storeWords,
          /* Plain text, not the finished badge: an island's props cross the
             server → client boundary, and the word "off" belongs to the
             shopper's dictionary, which only the client has. */
          campaignLabel: settings.campaignBadge
            ? campaignLabel(context.campaigns ?? [], settings.campaignId, context.currency)
            : undefined,
          badgeTone: settings.badgeTone,
          promises:
            settings.layout === "card" && settings.promises
              ? (context.trustBadges ?? []).map((badge) => badge.text.trim())
              : [],
          /* Where the rotation dots sit. Card and open only — the full-bleed
             hero above draws its own on the photograph and has nowhere else to
             put them, and `field-visibility.ts` hides the control there. */
          dots: settings.dots,
          nav,
          interval,
        }}
      />
    );
  }

  const title = slide.title?.trim();
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
    /* A LABEL is the whole condition, for both buttons. It used to take a
       label *and* a link here, so a merchant who typed "Shop now" and left the
       link empty got no button at all — while the full-bleed hero, and the
       carousel these slides used to rotate in, both drew one. An empty link is
       not an absent button, it is the catalogue: `merchantLinkHref` has said so
       since it was written, and `storeWords` has always relied on it. */
    const primary = slide.buttonLabel?.trim();
    const secondary = secondaryLabel;
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

  /* A destination with no button becomes the hero itself, as both islands
     already do — until now the static branch stored the link and did nothing
     with it. Only where there is NO button: the link covers the whole hero, so
     rendering it alongside one would paint over that button and eat its press.
     `storeWords` always draws its pair, so it never reaches here. */
  const slideLink =
    !settings.storeWords && !actions ? (
      <HeroSlideLink
        base={context.base}
        link={slide.link}
        label={title || slide.badge?.trim() || storeName}
      />
    ) : null;

  const copy = {
    badge:
      slide.badge?.trim() ||
      (settings.campaignBadge
        ? campaignBadge(context.campaigns ?? [], settings.campaignId, context.currency)
        : undefined),
    badgeTone: settings.badgeTone,
    title: title || storeName,
    hideTitle: !title && !settings.storeWords,
    subtitle: slide.subtitle?.trim() || undefined,
    actions,
    photo: heroSlidePhoto(slide, settings.storeBanner ? context.banner : undefined),
    hideMobileCopy: slide.hideTextOnMobile,
    slideLink,
  };
  return settings.layout === "open" ? (
    <HeroOpenView {...copy} align={align} frame={frame} placement={placement} />
  ) : (
    <HeroCardView
      {...copy}
      align={align}
      frame={frame}
      placement={placement}
      promises={settings.promises ? (context.trustBadges ?? []).map((badge) => badge.text.trim()) : []}
    />
  );
}
