"use client";
// coding-standard: maintained

import { focalPosition } from "@/lib/storefront-focal";
import { HeroSlidesView } from "@/components/storefront/hero-slides";
import { HeroCardView, HeroOpenView } from "@/components/storefront/home/hero-static";
import { HeroFullBleedView } from "@/components/storefront/home/hero-fullbleed";
import {
  bannerPhoto,
  campaignBadge,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The hero family — **three, and they answer one question each.**
 *
 * A page uses exactly one, and which one is the single biggest reason two shops
 * read as different businesses. What separates them is how FRAMED the hero is:
 *
 * - `hero-card` — framed. Copy and photo inside a bordered card.
 * - `hero-open` — unframed. The copy sits on the page itself, so a store that
 *   chose a tinted ground gets to show it on the first screen.
 * - `hero-fullbleed` — the photograph *is* the hero, type laid over it.
 *
 * **Three more retired on 2026-09-06**, and each for its own reason:
 *
 * - `hero-split` was the middle position on that axis — framed, with a bigger
 *   picture. A merchant choosing between four points on one axis is choosing
 *   between shades of the same decision; the ends are the decision.
 * - `hero-manifesto` was `hero-open` with no picture and centred type, and
 *   `hero-open` already collapses to one column when no banner is set. All it
 *   really added was an alignment, which is now `theme.heroAlign` — a question
 *   a merchant can answer without knowing that "Centred statement" is where
 *   alignment lives, and without silently discarding the banner they uploaded.
 * - `search-hero` had nothing composing it, and the one vertical it was built
 *   for refuses it in writing: Fresh Market's `search-first` header already
 *   carries the search box, and a hero repeating it is the page saying the same
 *   thing twice on its most expensive screen.
 *
 * **One deliberate change from the 2026-08-12 lift:** the hardcoded corner radii
 * read `--radius-lg` / `--radius-sm`, so a store on the Sharp or Round setting
 * gets it up here too.
 *
 * `heroSlides` short-circuits every static hero: an owner who built a carousel
 * gets slides, whatever the section chose — but **each hero now rotates them in
 * its OWN shape** (2026-09-20, decision D1). `hero-card` and `hero-open` used to
 * hand off to `HeroCarousel`, a dark edge-to-edge photo carousel, so a shop that
 * chose the framed card and added a second slide was shown a different section
 * with nothing saying so. They render `HeroSlidesView` instead; `hero-fullbleed`
 * has always drawn its own slides. Both rotate on the same beat via
 * `useHeroRotation`.
 *
 * `HeroCarousel` had no caller left once this landed on both surfaces, and was
 * deleted with it. Its CSS block in `storefront.css` outlives it for now — the
 * `.sf-hero-*` prefix is shared with three live heroes, so untangling it is its
 * own pass (plan §5).
 *
 * The markup lives in `hero-static.tsx` and `hero-fullbleed.tsx`, shared with
 * the Storefront Builder's hero; these components resolve the store's banner
 * and its copy.
 */

/** Classic — the framed hero card (`HeroCardView`). */
export function HeroCard(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb, store } = props;
  const promises = (store.trustBadges ?? []).flatMap((item) => {
    const label = item.text?.trim();
    return label ? [label] : [];
  });
  if (heroSlides?.length) {
    return (
      <div style={{ ...wrap, padding: "var(--pad)" }}>
        <HeroSlidesView
          base={base}
          slides={heroSlides}
          storeName={store.name}
          layout="card"
          promises={promises}
        />
      </div>
    );
  }
  const photo = bannerPhoto(hb);
  const bannerSrc = banner || photo.mobileSrc;
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <HeroCardView
        badge={hb?.badge || campaignBadge(props) || undefined}
        title={hb?.title || store.name}
        subtitle={hb?.subtitle || undefined}
        actions={heroBtns(base, t, t.shopNow, hb)}
        photo={bannerSrc ? { ...photo, src: bannerSrc } : undefined}
        promises={promises}
      />
    </div>
  );
}

/**
 * Open — the copy on the page itself (`HeroOpenView`).
 *
 * **The one hero that reads `theme.heroAlign`.** Centred, with no banner, this
 * is what `hero-manifesto` used to be — and the merchant keeps their banner
 * instead of discovering it was dropped by the section they chose.
 */
export function HeroOpen(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb, store } = props;
  const align = props.heroAlign ?? "left";
  if (heroSlides?.length) {
    return (
      <div style={{ ...wrap, padding: "clamp(28px,5vw,64px) var(--pad) clamp(20px,3vw,40px)" }}>
        <HeroSlidesView
          base={base}
          slides={heroSlides}
          storeName={store.name}
          layout="open"
          align={align}
        />
      </div>
    );
  }
  const photo = bannerPhoto(hb);
  const bannerSrc = banner || photo.mobileSrc;
  return (
    <div style={{ ...wrap, padding: "clamp(28px,5vw,64px) var(--pad) clamp(20px,3vw,40px)" }}>
      <HeroOpenView
        badge={hb?.badge || campaignBadge(props) || undefined}
        title={hb?.title || store.name}
        subtitle={hb?.subtitle || undefined}
        actions={heroBtns(base, t, t.shopNow, hb, align)}
        photo={bannerSrc ? { ...photo, src: bannerSrc } : undefined}
        align={align}
      />
    </div>
  );
}

/**
 * Full-bleed — the photograph is the hero (`HeroFullBleedView`). Without slides
 * it shows the store banner, whose fit defaults to `cover` here: Full Bleed
 * always cropped before the fit control existed.
 */
export function HeroFullBleed({ base, t, banner, heroSlides, heroBanner: hb, store }: SectionProps) {
  return (
    <HeroFullBleedView
      base={base}
      slides={heroSlides ?? []}
      storeName={store.name}
      fallback={{
        image: banner || hb?.mobileImage,
        mobileImage: hb?.mobileImage,
        fit: bannerPhoto(hb, "cover").fit,
        focal: focalPosition(hb?.focal),
        mobileFocal: focalPosition(hb?.mobileFocal || hb?.focal),
        badge: hb?.badge?.trim(),
        title: hb?.title?.trim() || store.name,
        subtitle: hb?.subtitle?.trim(),
        ctaLabel: hb?.primaryLabel?.trim() || t.startShopping,
        link: hb?.primaryLink,
      }}
    />
  );
}
