// coding-standard: maintained

import type { HeaderMenuSource } from "@/lib/storefront-client";
import type {
  Image,
  StorefrontFooterGroup,
  StorefrontHeroSlide,
  StorefrontMenuItem,
  StorefrontNav,
  UpdateStorefrontSettingsDto,
} from "@/types";
import {
  asHomeVariant,
  resolveHomeSections,
} from "@/lib/storefront-home-sections";
import { cleanHeroBanner } from "@/components/ecommerce/customize/banner-hero-fields";
import type {
  CustomizeDraft,
  FooterContentPagesDraft,
} from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The two things the Customize draft turns into: the settings PATCH and the
 * live-preview message. **They are built here together on purpose.**
 *
 * Every list the merchant edits gets trimmed on the way to the server — a footer
 * group with a blank title is dropped, an untitled slide never ships. If the
 * preview applied different rules it would promise a column or a slide the shop
 * would never render, which is the class of bug this file exists to prevent.
 * Change a trimming rule and both sides move at once.
 */

const trimSlides = (slides: StorefrontHeroSlide[]): StorefrontHeroSlide[] =>
  // Untitled slides are drafts — a title is required to ship.
  slides
    .filter((s) => s.title.trim())
    .map((s) => ({
      image: s.image ?? null,
      badge: s.badge?.trim() || undefined,
      title: s.title.trim(),
      subtitle: s.subtitle?.trim() || undefined,
      buttonLabel: s.buttonLabel?.trim() || undefined,
      link: s.link?.trim() || undefined,
    }));

const trimHeaderMenu = (items: StorefrontMenuItem[]): StorefrontMenuItem[] =>
  items
    .filter((it) => it.label.trim())
    .map((it) => ({
      label: it.label.trim(),
      type: it.type,
      value: it.type === "collections" ? "" : it.value.trim(),
      // A collections block expands inline; drop children left over from before
      // the row's type was switched.
      children:
        it.type !== "collections" && it.children?.length
          ? it.children
              .filter((c) => c.label.trim())
              .map((c) => ({
                label: c.label.trim(),
                type: c.type,
                value: c.value.trim(),
              }))
          : undefined,
    }));

const trimFooterGroups = (groups: StorefrontFooterGroup[]): StorefrontFooterGroup[] =>
  groups
    .filter((g) => g.title.trim())
    .map((g) => ({
      title: g.title.trim(),
      links: g.links.filter((l) => l.label.trim()),
    }));

// A blank heading means "use the storefront's built-in one", so it is omitted
// rather than sent empty.
const trimContentPages = (c: FooterContentPagesDraft) => ({
  show: c.show,
  title: c.title.trim() || undefined,
});

const trimBadges = (badges: CustomizeDraft["badges"]) =>
  // All three slots are kept (empty = the storefront's default copy) so their
  // positions survive a reload.
  badges.map((b) => ({
    text: b.text.trim(),
    subtitle: b.subtitle?.trim() || undefined,
    icon: b.icon,
  }));

// Both slots kept for the same reason as the badges — an empty field means
// "use the built-in copy for this tile", not "drop the tile".
const trimPromoTiles = (tiles: CustomizeDraft["promoTiles"]) =>
  tiles.map((t) => ({
    label: t.label?.trim() || undefined,
    title: t.title?.trim() || undefined,
    link: t.link?.trim() || undefined,
  }));

/** Listed collections only, display name winning, draft order preserved —
 *  mirrors the public `GET /:slug/categories` contract exactly. */
const publicCollections = (collections: CustomizeDraft["collections"]) =>
  collections
    .filter((c) => c.isListed)
    .map((c) => ({
      _id: c._id,
      name: c.displayName.trim() || c.name,
      slug: c.slug,
    }));

function toNav(draft: CustomizeDraft): StorefrontNav {
  const a = draft.announcement;
  return {
    header: trimHeaderMenu(draft.navHeader),
    footer: trimFooterGroups(draft.footerGroups),
    footerContentPages: trimContentPages(draft.footerContentPages),
    announcement: {
      enabled: a.enabled,
      text: a.text.trim() || undefined,
      link: a.link.trim() || undefined,
      bgColor: a.bgColor,
      textColor: a.textColor.trim() || undefined,
      icon: a.icon.trim() || undefined,
      ctaLabel: a.ctaLabel.trim() || undefined,
      dismissible: a.dismissible,
      size: a.size,
      // Sent wholesale (nav replaces on PATCH); null clears a removed image and
      // the backend deletes the orphaned asset.
      bgImage: a.bgImage,
      overlay: a.overlay,
      overlayOpacity: a.overlayOpacity,
      bgFit: a.bgFit,
    },
  };
}

/** One PATCH carrying theme, templates and nav — the page's whole Save. */
export function toSettingsPayload(draft: CustomizeDraft): UpdateStorefrontSettingsDto {
  return {
    theme: {
      preset: draft.preset,
      brandColor: draft.brandColor,
      accentColor: draft.accentColor,
      footerText: draft.footerText.trim() || undefined,
      // The backend PATCH **replaces the whole `theme` subdocument**
      // (`Object.assign(settings, dto)`), so a key omitted here is a key deleted
      // from the store — saving the footer text would wipe a section order the
      // merchant set earlier. `undefined` is still correct for a store that has
      // never reordered: it keeps the key absent, which is what makes the
      // storefront use the look's default order.
      homepageSections: draft.homepageSections ?? undefined,
      appliedThemeId: draft.appliedThemeId || undefined,
    },
    trustBadges: trimBadges(draft.badges),
    promoTiles: trimPromoTiles(draft.promoTiles),
    heroBanner: cleanHeroBanner(draft.heroBanner),
    heroSlides: trimSlides(draft.heroSlides),
    templates: draft.templates,
    nav: toNav(draft),
  };
}

/** The `ezycore-preview` message body — the keys the storefront's preview store reads. */
export function toPreviewPayload(
  draft: CustomizeDraft,
  {
    logo,
    banner,
    forceHeroSlides,
    forceCollectionsMenu,
  }: {
    /** Effective (org-fallback applied) images; `null` = none, and must stay null. */
    logo: Image | null;
    banner: Image | null;
    /** Preview slides / collections while their panel is open, whatever is saved. */
    forceHeroSlides: boolean;
    forceCollectionsMenu: boolean;
  },
) {
  return {
    theme: { brandColor: draft.brandColor, accentColor: draft.accentColor },
    // The RESOLVED order, never the raw draft: `null` (never reordered) has to
    // reach the preview as the look's real list, and sending `undefined` would
    // leave the preview store holding whatever was drafted before a Discard.
    homepageSections: resolveHomeSections(
      draft.homepageSections,
      asHomeVariant(draft.templates.home),
    ),
    templates: {
      home: draft.templates.home,
      footer: draft.templates.footer,
      header: draft.templates.header,
      productCard: draft.templates.productCard,
      cardActions: draft.templates.cardActions,
      pagination: draft.templates.pagination,
      // Reached through the preview's page switcher; each is read by exactly one
      // storefront page, via `useStoreTemplate`.
      collection: draft.templates.collection,
      product: draft.templates.product,
      checkout: draft.templates.checkout,
      hero: forceHeroSlides ? "slides" : draft.templates.hero,
      headerMenu: (forceCollectionsMenu
        ? "collections"
        : draft.templates.headerMenu) as HeaderMenuSource,
    },
    trustBadges: trimBadges(draft.badges),
    promoTiles: trimPromoTiles(draft.promoTiles),
    heroSlides: trimSlides(draft.heroSlides),
    heroBanner: cleanHeroBanner(draft.heroBanner),
    nav: toNav(draft),
    collections: publicCollections(draft.collections),
    // `null` (not undefined) is what tells the preview store "removed" apart
    // from "not sent yet".
    logo,
    banner,
  };
}
