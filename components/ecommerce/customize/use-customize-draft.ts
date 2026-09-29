"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReorderCollections,
  useSaveStorefrontSiteDraft,
  useStorefrontCollections,
  useUpdateCollection,
  useUpdateStorefrontSettings,
  type StorefrontSite,
} from "@/services/api";
import { getPreset, resolveDesign, type StoreDesign } from "@/lib/storefront-theme";
import { getReadyMadeTheme, type ReadyMadeTheme } from "@/lib/storefront-themes";
import {
  resolveHeaderMenu,
  resolveHeroAlign,
  sectionInstances,
} from "@/lib/storefront-templates";
import { mergeSectionConfig } from "@/lib/storefront-sections";
import {
  resolveMenuSettings,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import {
  resolveFilterSettings,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import {
  mobileTemplate,
  resolveMobileChrome,
  type MobileChrome,
} from "@/lib/storefront-mobile";
import { HOME_PRESET_SECTIONS } from "@/lib/storefront-section-ids";
import type { StoreHomeSection, StoreSectionConfig } from "@/lib/storefront-client";
import type {
  ContactButtonPage,
  Image,
  StorefrontContactButton,
  StorefrontFooterBlock,
  StorefrontFooterGroup,
  StorefrontFooterStyle,
  StorefrontHeroBanner,
  StorefrontHeroSlide,
  StorefrontHomeCollections,
  StorefrontLogoStyle,
  StorefrontMenuItem,
  StorefrontSettings,
  StorefrontStripScope,
  StorefrontStripSpace,
  StorefrontTrustBadge,
} from "@/types";
import { toSettingsPatch } from "@/components/ecommerce/customize/draft-payloads";
import { settingsWithSiteLook } from "@/components/ecommerce/customize/site-look";
import {
  RETIRED_TEMPLATE_KEYS,
  TEMPLATE_OPTIONS,
} from "@/components/ecommerce/customize/template-options";
import {
  toRowValue,
  type CollectionRowValue,
} from "@/components/ecommerce/collections/collection-row";
import { isValidHexColor } from "@/ui/components/color-field";
import type { MarqueeSpeed } from "@/lib/storefront-strip-display";
import {
  resolveUtilityBar,
  type ResolvedUtilityBar,
} from "@/lib/storefront-utility-bar";
import {
  resolveDesktopHeader,
  resolveLanguageTheme,
  type ResolvedDesktopHeader,
  type ResolvedLanguageTheme,
} from "@/lib/storefront-language-theme";

/** Announcement-bar draft — every field always defined, so inputs stay controlled. */
export interface AnnouncementDraft {
  enabled: boolean;
  useShippingRule: boolean;
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
  icon: string;
  ctaLabel: string;
  dismissible: boolean;
  size: "sm" | "md" | "lg";
  /** Scroll the message right-to-left instead of centring it on one line. */
  marquee: boolean;
  marqueeSpeed: MarqueeSpeed;
  bgImage: Image | null;
  overlay: string;
  overlayOpacity: number;
  bgFit: "cover" | "tile";
  showOnDesktop: boolean;
  showOnMobile: boolean;
}

/**
 * Campaign-strip draft (Customize → Campaign strip).
 *
 * Presentation only, and deliberately so: there is no date, no discount and no
 * campaign picker here. What the strip *says* comes from the running campaign
 * in Marketing → Campaigns, and whether one is running is that campaign's own
 * schedule — a merchant must not be able to extend a finished sale from the
 * look-and-feel editor. Every field is defined so the inputs stay controlled.
 */
export interface CampaignStripDraft {
  enabled: boolean;
  showOn: StorefrontStripScope;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  /** Empty ⇒ the theme's soft primary. */
  bgColor: string;
  /** Empty ⇒ auto-contrast on `bgColor`, else the theme's primary. */
  textColor: string;
  size: "sm" | "md" | "lg";
  paddingY: StorefrontStripSpace;
  paddingX: StorefrontStripSpace;
  dismissible: boolean;
}

/**
 * Contact-launcher draft. Every field defined so the inputs stay controlled, and
 * the number is absent on purpose — it belongs to Settings → General, and two
 * independently-edited copies of a phone number is how a merchant ends up
 * answering the wrong one.
 */
export interface ContactButtonDraft {
  enabled: boolean;
  label: string;
  greeting: string;
  position: "right" | "left";
  /** Empty ⇒ every page (see `isPageAllowed`). */
  showOn: ContactButtonPage[];
  /** Preserved legacy overrides until the backend contract removes them explicitly. */
  channels: StorefrontContactButton["channels"];
  hoursEnabled: boolean;
  /** Days the merchant answers, 0 = Sunday. Empty means every day. */
  hoursDays: number[];
  hoursFrom: string;
  hoursTo: string;
  offlineNote: string;
  nudgeEnabled: boolean;
  nudgeText: string;
  nudgeDelay: number;
}

/** The auto content-pages footer column (show + heading override). */
export interface FooterContentPagesDraft {
  show: boolean;
  title: string;
}

/** Responsive visibility for checkout-method badges in the footer. */
export interface FooterPaymentMethodsDraft {
  showOnDesktop: boolean;
  showOnMobile: boolean;
}

/**
 * Sign-up copy for the Stay-in-touch footer. Every field defined so the inputs
 * stay controlled; empty means "use the storefront's localized wording", which
 * is why `toSettingsPayload` sends `undefined` rather than `""`.
 */
export interface FooterNewsletterDraft {
  heading: string;
  blurb: string;
  buttonLabel: string;
}

/** Complete utility-bar values keep every Customize control selected. */
export type UtilityBarDraft = ResolvedUtilityBar;

/**
 * Everything the Customize page can change, in one object.
 *
 * It is deliberately ONE draft rather than per-section state: the rail's parts
 * mount and unmount as they open, and the slides/collections panels take the
 * whole rail over. Anything held inside a part would be silently discarded the
 * moment the merchant opened another one — while the live preview, fed from
 * here, went on showing the edit that had just been thrown away.
 *
 * Media (logo, banner, slide and announcement images) is NOT here: uploads
 * persist immediately through their own multipart PATCH, so they read off
 * `settings` and can't be "unsaved".
 */
export interface CustomizeDraft {
  preset: string;
  brandColor: string;
  accentColor: string;
  footerText: string;
  /**
   * How the uploaded logo is drawn. Unlike the logo FILE (which saves on upload
   * through its own multipart PATCH), this is ordinary draft state on the page's
   * single Save — it is settings, not media.
   */
  logoStyle: StorefrontLogoStyle;
  /** Homepage category-row layout (Customize → Home page). */
  homeCollections: StorefrontHomeCollections;
  /** Every `templates.*` id, including `hero` and `headerMenu`. */
  templates: Record<string, string>;
  /**
   * The phone chrome, **complete** — the merchant's overrides already merged
   * onto the template in `templates.mobile`.
   *
   * Held resolved rather than as a diff for the same reason `design` and
   * `heroAlign` are: the slot editor is a set of controlled inputs, and a
   * partial value would leave a toggle showing nothing while the storefront
   * happily rendered the template's answer. The diff is computed back on the way
   * out (`mobileOverrides` in `draft-payloads.ts`), so what gets STORED is still
   * only what the merchant changed.
   */
  mobile: MobileChrome;
  badges: StorefrontTrustBadge[];
  heroSlides: StorefrontHeroSlide[];
  heroBanner: StorefrontHeroBanner;
  navHeader: StorefrontMenuItem[];
  /**
   * How the menu behaves per device. Edited in three parts — how it opens under
   * Header, what it lists under Menu, the category sidebar under Page layout —
   * and `PART_SLICE` splits it field by field to match. RESOLVED, like `mobile`,
   * so every control is concrete; `menuSettingsOverrides` diffs it back down on
   * save, so only what the merchant changed is stored.
   */
  navMenu: ResolvedMenuSettings;
  /**
   * Catalogue filters & sort (Customize → Filters & sort). Resolved like
   * `navMenu`; `filterSettingsOverrides` diffs it back down on save.
   */
  navFilters: ResolvedFilterSettings;
  announcement: AnnouncementDraft;
  campaignStrip: CampaignStripDraft;
  utilityBar: UtilityBarDraft;
  /** Languages and colour schemes on offer (Customize → Language & theme). */
  languageTheme: ResolvedLanguageTheme;
  /** The computer header's behaviour (Customize → Header → Computer). */
  desktopHeader: ResolvedDesktopHeader;
  contactButton: ContactButtonDraft;
  footerGroups: StorefrontFooterGroup[];
  footerPaymentMethods: FooterPaymentMethodsDraft;
  footerContentPages: FooterContentPagesDraft;
  /** The footer's frame. `{}` ⇒ the footer as it was before styles existed. */
  footerStyle: StorefrontFooterStyle;
  /**
   * A composed footer, or `null` for "the fixed layout" — the state of every
   * store until its first block edit. See `lib/storefront-footer/blocks.ts`.
   */
  footerBlocks: StorefrontFooterBlock[] | null;
  /** Bottom-bar note; empty ⇒ the storefront prints the store's currency. */
  footerNote: string;
  /** Contact-first heading; empty ⇒ the localized "Order by phone". */
  footerContactHeading: string;
  footerNewsletter: FooterNewsletterDraft;
  /** Type family + spatial rhythm (Customize → Design). Always complete. */
  design: StoreDesign;
  /**
   * Where the open hero's copy sits (Customize → Hero). Always concrete, never
   * unset — the picker is a controlled input, so an absent value would show
   * nothing selected while the storefront happily renders left.
   */
  heroAlign: "left" | "center";
  /**
   * The homepage as an ordered section list (Customize → Home page → Sections).
   * Empty means "the merchant switched everything off", which the storefront
   * resolver treats as unset rather than rendering a blank page.
   */
  homepageSections: StoreHomeSection[];
  /**
   * Per-section config, joined to `homepageSections[].key`.
   *
   * A sibling of the section list, not a field on it, and NOT touched by
   * `applyThemeToDraft` — that is the whole reason it lives outside `theme` on
   * the wire. A merchant who tries three themes must still have the collections
   * they pointed their rows at.
   */
  sectionConfig: StoreSectionConfig[];
  /**
   * Carried, never edited. The Save payload rebuilds `theme` as a whole object
   * and the backend replaces the sub-document with it, so a field the draft does
   * not hold is a field Save deletes. Nothing in the editor writes this — a
   * ready-made theme does — and dropping it would erase which theme a store is
   * on the first time its owner changed anything else.
   */
  appliedThemeId?: string;
  /** Category docs, not settings — saved through their own mutations. */
  collections: CollectionRowValue[];
}

/**
 * One row of the rail.
 *
 * `look` was two rows — `brand` (preset, colours, logo) and `design` (type,
 * surface, spacing) — until 2026-09-06. Both sat at 12% adoption while the rows
 * named after something a merchant can see on their own site sat at 51-67%, and
 * between them they held every colour control in the product: a merchant asking
 * "how do I change my shop's colours?" had to guess which of two abstract names
 * hid the half they wanted. One row, one question.
 */
export type PartId =
  | "look"
  | "announcement"
  | "campaign"
  | "header"
  | "menu"
  | "language"
  | "cards"
  | "filters"
  | "contact"
  | "footer"
  | "shell"
  | "content";

/**
 * Which slice of the draft each part owns. Dirty state is derived by comparing
 * these against the baseline rather than set by hand, so a new field in a part
 * is covered the moment it is added to the slice — there is no `setDirty()` call
 * to forget.
 *
 * **Only site-wide parts have a slice** (2026-09-20). The draft still CARRIES
 * every page key it ever did — `heroSlides`, `heroBanner`, `homepageSections`,
 * `templates.product` and the rest — because a look save replaces each block it
 * sends wholesale, so a block dropped from the payload would be erased rather
 * than left alone (`seedTemplates` states the same rule for template ids). They
 * simply have no editor here any more: their pages own them.
 */
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const PART_SLICE: Record<PartId, (d: CustomizeDraft) => unknown> = {
  look: (d) => [d.preset, d.brandColor, d.accentColor, d.logoStyle, d.design],
  announcement: (d) => d.announcement,
  campaign: (d) => d.campaignStrip,
  // The top of the shop on both screens (2026-09-29): both layouts, the phone
  // chrome over its template, the info strip, and how the menu OPENS — the
  // phone panel and the computer dropdown row. It absorbed the Phone bar and
  // Utility bar rows, so the save bar names the one row a merchant edited.
  header: (d) => {
    const { mobile, desktop } = d.navMenu;
    return [
      d.templates.header,
      d.templates.mobile,
      d.mobile,
      d.utilityBar,
      d.desktopHeader,
      [mobile.layout, mobile.open, mobile.images, mobile.subImages, mobile.chips, mobile.title, mobile.drawerWidth],
      [desktop.row, desktop.dropdown, desktop.openOn, desktop.overflow],
    ];
  },
  // WHAT is in the menu, on every device — the source, the links, and the
  // answers about its contents that `nav.menu` stores per device.
  menu: (d) => {
    const { mobile, desktop } = d.navMenu;
    return [
      d.templates.headerMenu,
      d.navHeader,
      d.navMenu.subcategories,
      [mobile.allProducts, mobile.allProductsLabel, mobile.viewAll, mobile.collectionStrip],
      [desktop.viewAll, desktop.collectionStrip],
    ];
  },
  // Which languages and colour schemes shoppers get (2026-09-29).
  language: (d) => d.languageTheme,
  cards: (d) => [
    d.templates.productCard,
    d.templates.cardActions,
    d.templates.cardTagBadges,
    d.templates.discountBadge,
    d.templates.imageFit,
    d.templates.imageRatio,
  ],
  filters: (d) => d.navFilters,
  contact: (d) => d.contactButton,
  footer: (d) => [
    d.templates.footer,
    d.footerText,
    d.footerNote,
    d.footerContactHeading,
    d.footerNewsletter,
    d.badges,
    d.footerGroups,
    d.footerPaymentMethods,
    d.footerContentPages,
    d.footerStyle,
    d.footerBlocks,
  ],
  // The frame, and how the category sidebar opens when the frame is one.
  shell: (d) => [d.templates.shell, d.navMenu.desktop.railOpen],
  content: (d) => d.templates.contentLayout,
};

/**
 * Every part id, derived from the dirty-tracking map so there is one list. The
 * rail's own grouping is checked against it: an id here that no group renders is
 * a setting a merchant cannot reach, and nothing else would notice.
 */
export const PART_IDS = Object.keys(PART_SLICE) as PartId[];

/**
 * The parts whose slice differs between two drafts — what the save bar names
 * and what `toSettingsPatch` sends. A field no slice covers is a field whose
 * edit is never saved, which is why `nav.menu`'s split is pinned field by field
 * in the tests.
 */
export const changedParts = (draft: CustomizeDraft, baseline: CustomizeDraft): PartId[] =>
  PART_IDS.filter((id) => !same(PART_SLICE[id](draft), PART_SLICE[id](baseline)));

/**
 * Seed every template id from the saved object, keeping keys no picker owns so
 * the wholesale PATCH can't drop them.
 */
function seedTemplates(settings: StorefrontSettings): Record<string, string> {
  const t = (settings.templates ?? {}) as Record<string, string>;
  const seed: Record<string, string> = { ...t };
  for (const [key, options] of Object.entries(TEMPLATE_OPTIONS)) {
    seed[key] = t[key] || options[0].value;
  }
  seed.hero = t.hero || "slides";
  seed.headerMenu = resolveHeaderMenu(
    settings.templates,
    (settings.nav?.header ?? []).length > 0,
  );
  // `cardActions` is the one key whose unset meaning depends on another key: a
  // compact store has always rendered the inline "+". Seeding it to the first
  // option instead would restyle every compact shop's cards the next time its
  // owner saved anything. Mirrors `resolveCardActions`.
  if (!t.cardActions) {
    seed.cardActions = t.productCard === "compact" ? "icon-only" : "add-buy";
  }
  for (const key of RETIRED_TEMPLATE_KEYS) delete seed[key];
  return seed;
}

/**
 * Flatten the stored `contactButton` into the editor's shape.
 *
 * Legacy channel overrides are not editable, but remain in the draft so an
 * explicit Contact Button edit cannot erase data the backend still supports.
 */
function seedContactButton(settings: StorefrontSettings): ContactButtonDraft {
  const c = settings.contactButton;
  const h = c?.hours;
  const n = c?.nudge;
  return {
    enabled: c?.enabled ?? false,
    label: c?.label ?? "",
    greeting: c?.greeting ?? "",
    position: c?.position === "left" ? "left" : "right",
    showOn: c?.showOn ?? [],
    channels: c?.channels,
    hoursEnabled: h?.enabled ?? false,
    hoursDays: h?.days ?? [],
    hoursFrom: h?.from ?? "10:00",
    hoursTo: h?.to ?? "20:00",
    offlineNote: h?.offlineNote ?? "",
    nudgeEnabled: n?.enabled ?? false,
    nudgeText: n?.text ?? "",
    nudgeDelay: n?.delaySeconds ?? 8,
  };
}

/**
 * Saved settings → the draft shape.
 *
 * Exported for the theme store's Preview, which needs a throwaway draft to feed
 * `BrowserPreview` — the merchant's real shop, with a theme laid over it, and
 * nothing editable. Building that by hand would be a second, drifting answer to
 * "what does a draft look like"; the whole point of the live preview is that it
 * runs the same path the Customize page does.
 */
export function seedDraft(settings: StorefrontSettings): Omit<CustomizeDraft, "collections"> {
  const t = settings.theme ?? {};
  // Merchant-written wording is a SIBLING of theme now — see StorefrontCopy.
  const c = settings.copy ?? {};
  const presetDefaults = getPreset(t.preset);
  const a = settings.nav?.announcement;
  const cs = settings.nav?.campaignStrip;
  const templates = seedTemplates(settings);
  return {
    preset: t.preset ?? "default",
    brandColor: t.brandColor ?? presetDefaults.brandColor,
    accentColor: t.accentColor ?? presetDefaults.accentColor,
    footerText: c.footerText ?? "",
    // Seeded as the saved object, empty when unset — an absent field means
    // "leave it as it was", which is exactly what the resolvers default to.
    logoStyle: t.logo ?? {},
    homeCollections: t.homeCollections ?? {},
    // Resolved, not raw: the pickers are controlled inputs, so an unset (or
    // retired) axis has to arrive as a concrete id or its tile shows nothing
    // selected while the storefront happily renders the default.
    design: resolveDesign(t.design),
    heroAlign: resolveHeroAlign(t.heroAlign),
    // Seeded from the saved list, else empty so the storefront falls back to the
    // section list implied by the home template.
    homepageSections: t.homepageSections ?? [],
    sectionConfig: settings.sectionConfig ?? [],
    appliedThemeId: t.appliedThemeId,
    templates,
    // Resolved, like `design` above and for the same reason — the slot editor's
    // inputs are controlled, so every field has to arrive concrete.
    mobile: resolveMobileChrome(settings.templates, t.mobile),
    // The API supports zero to four; preserve the complete ordered list.
    badges: settings.trustBadges ?? [],
    heroSlides: settings.heroSlides ?? [],
    heroBanner: settings.heroBanner ?? {},
    navHeader: settings.nav?.header ?? [],
    navMenu: resolveMenuSettings(settings.nav?.menu),
    // The collection layout's legacy `sidebar` reads as a sidebar placement —
    // the same answer the storefront gives, so the panel shows what the shop does.
    navFilters: resolveFilterSettings(settings.nav?.filters, templates.collection),
    announcement: {
      enabled: a?.enabled ?? false,
      useShippingRule: a?.useShippingRule ?? false,
      text: a?.text ?? "",
      link: a?.link ?? "",
      bgColor: a?.bgColor ?? "#2563eb",
      textColor: a?.textColor ?? "",
      icon: a?.icon ?? "",
      ctaLabel: a?.ctaLabel ?? "",
      dismissible: a?.dismissible ?? false,
      size: a?.size ?? "sm",
      // Off by default: every bar that exists today sits still, and a shop's
      // announcement suddenly moving after an unrelated save is not a change
      // any merchant asked for.
      marquee: a?.marquee ?? false,
      marqueeSpeed: a?.marqueeSpeed ?? "normal",
      bgImage: a?.bgImage ?? null,
      overlay: a?.overlay ?? "#000000",
      overlayOpacity: a?.overlayOpacity ?? 40,
      bgFit: a?.bgFit ?? "cover",
      // Both breakpoints on by default: the bar predates these switches, and an
      // unset field must not hide a bar the merchant already had running.
      showOnDesktop: a?.showOnDesktop ?? true,
      showOnMobile: a?.showOnMobile ?? true,
    },
    // Defaults reproduce the hard-coded strip exactly (13px text, 8px/16px
    // padding, every page, both breakpoints), so seeding a store that has never
    // opened this part cannot change how its storefront looks.
    campaignStrip: {
      enabled: cs?.enabled ?? true,
      showOn: cs?.showOn ?? "all",
      showOnDesktop: cs?.showOnDesktop ?? true,
      showOnMobile: cs?.showOnMobile ?? true,
      bgColor: cs?.bgColor ?? "",
      textColor: cs?.textColor ?? "",
      size: cs?.size ?? "sm",
      paddingY: cs?.paddingY ?? "md",
      paddingX: cs?.paddingX ?? "md",
      dismissible: cs?.dismissible ?? false,
    },
    utilityBar: resolveUtilityBar(settings.nav?.utilityBar, templates.header),
    languageTheme: resolveLanguageTheme(settings.nav?.languageTheme),
    desktopHeader: resolveDesktopHeader(settings.nav?.desktopHeader),
    contactButton: seedContactButton(settings),
    footerGroups: settings.nav?.footer ?? [],
    footerPaymentMethods: {
      showOnDesktop:
        settings.nav?.footerPaymentMethods?.showOnDesktop ?? true,
      showOnMobile: settings.nav?.footerPaymentMethods?.showOnMobile ?? true,
    },
    // `show` defaults on (legacy behaviour) so existing stores keep the column;
    // a blank title ⇒ the built-in "Information" heading.
    footerContentPages: {
      show: settings.nav?.footerContentPages?.show ?? true,
      title: settings.nav?.footerContentPages?.title ?? "",
    },
    footerStyle: settings.nav?.footerStyle ?? {},
    footerBlocks: settings.nav?.footerBlocks?.length ? settings.nav.footerBlocks : null,
    footerNote: c.footerNote ?? "",
    footerContactHeading: c.footerContactHeading ?? "",
    footerNewsletter: {
      heading: c.footerNewsletter?.heading ?? "",
      blurb: c.footerNewsletter?.blurb ?? "",
      buttonLabel: c.footerNewsletter?.buttonLabel ?? "",
    },
  };
}

/** Category rows are independent from the collection page's layout templates. */
export const haveCollectionRowsChanged = (
  draft: Pick<CustomizeDraft, "collections">,
  baseline: Pick<CustomizeDraft, "collections">,
): boolean => !same(draft.collections, baseline.collections);

/** A section list reduced to what a theme actually decides — its composition. */
const sectionTypes = (sections: StoreHomeSection[] | undefined) =>
  (sections ?? []).map((s) => s.type);

/**
 * Stamp a ready-made theme into a draft — **the one place that decides what a
 * theme is allowed to write.**
 *
 * It returns a patch rather than saving, so applying a theme is an ordinary
 * unsaved edit: the live preview repaints instantly, the save bar reports the
 * parts that changed, **Discard is the undo** and **Save is the confirm**. No
 * snapshot table, no "are you sure" modal, no second code path that could
 * persist something the preview never showed.
 *
 * Everything it touches is look. `footerText`, `footerNote`, the newsletter
 * copy, `navHeader`, `footerGroups`, `badges`, `heroSlides`, `heroBanner` and
 * the collections are **absent on purpose** — that is the `theme`-vs-`copy`
 * split (see `StorefrontCopy`) expressed as code. A merchant who tries three
 * themes must still have every word they wrote.
 *
 * `templates` is SPREAD over the current ones, never replaced: the bundle
 * deliberately omits `hero`, `headerMenu` and `checkout` (they depend on what
 * content a shop actually has), and a wholesale replace would blank them.
 */
export function applyThemeToDraft(
  draft: CustomizeDraft,
  theme: ReadyMadeTheme,
): Partial<CustomizeDraft> {
  const composition = sectionInstances(theme.sections);
  return {
    preset: "default",
    brandColor: theme.brandColor,
    accentColor: theme.accentColor,
    design: resolveDesign(theme.design),
    // Part of the LOOK, so a theme owns it and Classic resets it — a merchant
    // who centred their hero and then applied a theme built around a left one
    // must get the theme they picked, not a half of it.
    heroAlign: resolveHeroAlign(theme.heroAlign),
    // Category-row geometry is part of the look. Without resetting it here,
    // Fresh Market inherits Classic's saved strip and stops looking like its
    // own theme in both the picker preview and the applied storefront.
    homeCollections: { ...theme.homeCollections },
    templates: { ...draft.templates, ...theme.templates },
    // The phone chrome follows the template the theme just stamped, arrangement
    // and all. Without this a merchant who had rearranged their bar would apply
    // a theme, get its mobile template, and see it wearing the previous one's
    // slots — the same half-applied theme `homeCollections` above exists to
    // prevent, on the surface most of their shoppers actually use.
    mobile: resolveMobileChrome({ mobile: theme.templates.mobile }, undefined),
    // The homepage composition — the half that makes themes structurally
    // different rather than repainted. Replaced outright, not merged: a theme's
    // page is an ordered whole, and spreading the previous list over it would
    // leave a grocery shop's search hero sitting above a fashion editorial.
    //
    // Instances are minted DETERMINISTICALLY (`sectionInstances`) so applying
    // the same theme twice produces the same keys. Random keys would detach any
    // per-section config from its section on every apply, and would make
    // `isThemeModified` below report a theme as edited the instant it was
    // applied. A theme bundle stays a list of TYPES — it has no business
    // inventing instance identity.
    homepageSections: composition.sections,
    // A theme's own rows may arrive configured ("a grid, sourced newest"), and
    // that config has to land in the draft or the row renders as its bare
    // default. Folded UNDER the merchant's own entries, never over them: a
    // collection someone pointed a row at survives trying three themes, which
    // is the whole reason `sectionConfig` sits outside `theme` to begin with.
    sectionConfig: mergeSectionConfig(composition.config, draft.sectionConfig),
    appliedThemeId: theme.id,
  };
}

/**
 * The home template, which is a STARTING layout: it seeds the section list the
 * Sections editor then owns.
 *
 * **This is why the picker cannot be a plain `patchTemplate("home", …)`.**
 * `templates.home` reaches the shop only through `resolveSections`, which uses
 * the preset as the fallback for an EMPTY `homepageSections` — and no store has
 * one, because applying any theme fills it via `sectionInstances(theme.sections)`.
 * So the bare template write marked the part dirty, saved, and changed nothing a
 * shopper could see: the picker was inert on every theme (found in browser QA,
 * 2026-08-17).
 *
 * Seeded the way `applyThemeToDraft` does, and for the same reasons: replaced
 * outright rather than merged (a homepage is an ordered whole), with instances
 * minted deterministically so picking a layout twice yields the same keys.
 * The merchant's `sectionConfig` is preserved entry for entry and only ADDED to
 * — orphans are dropped in `toSettingsPayload`, a row the merchant pointed at a
 * collection keeps it when the same key comes back, and the new layout's own
 * implied config fills whatever it does not already cover.
 */
export function applyHomeTemplateToDraft(
  draft: CustomizeDraft,
  value: string,
): Partial<CustomizeDraft> {
  // ⚠ Re-picking the layout the shop is ALREADY on is a NO-OP, never a reseed.
  // The picker highlights the active tile, so clicking it again is the most
  // natural way to ask "what does this one look like?" — and that click used to
  // replace the merchant's whole composed section list with the preset's, with
  // no confirmation, no undo, and nothing in the UI to suggest a destructive
  // write. Seeding is for CHANGING layout; staying put changes nothing.
  if (value === draft.templates.home) return {};

  const preset = HOME_PRESET_SECTIONS[value];
  const composition = preset ? sectionInstances(preset) : null;
  return {
    templates: { ...draft.templates, home: value },
    // An id with no preset (retired, or from a newer build) still sets the
    // template — but must not blank the page, which an empty list would mean.
    ...(composition
      ? {
          homepageSections: composition.sections,
          sectionConfig: mergeSectionConfig(composition.config, draft.sectionConfig),
        }
      : {}),
  };
}

/**
 * Has the merchant edited the look since applying `appliedThemeId`? Compares
 * only what a theme writes, so changing footer wording — which a theme cannot
 * touch — must never read as "modified".
 */
export function isThemeModified(draft: CustomizeDraft): boolean {
  const theme = getReadyMadeTheme(draft.appliedThemeId);
  if (!theme) return false;
  const applied = applyThemeToDraft(draft, theme);
  return (
    draft.brandColor !== applied.brandColor ||
    draft.accentColor !== applied.accentColor ||
    draft.heroAlign !== applied.heroAlign ||
    !same(draft.design, applied.design) ||
    !same(draft.homeCollections, applied.homeCollections) ||
    !same(draft.templates, applied.templates) ||
    // TYPE sequence, not the instances: a key is identity plumbing, not look.
    // Two pages composed of the same sections in the same order ARE the theme,
    // even if a key was minted at a different index because the merchant added
    // a section and removed it again. Comparing keys would light the "Edited"
    // badge on a page that is visually identical to the theme.
    !same(sectionTypes(draft.homepageSections), sectionTypes(applied.homepageSections))
  );
}

export interface CustomizeDraftApi {
  draft: CustomizeDraft;
  patch: (p: Partial<CustomizeDraft>) => void;
  patchTemplate: (key: string, value: string) => void;
  /** `templates.home` + the section list it seeds — never `patchTemplate("home")`. */
  patchHomeTemplate: (value: string) => void;
  /**
   * `templates.mobile` + the arrangement it seeds — never
   * `patchTemplate("mobile")`, for the same reason `patchHomeTemplate` exists:
   * switching template has to RESET the slots, or a merchant who moved the cart
   * on one template and then picked another would get the new bar wearing the
   * old one's arrangement and no way back to what the tile showed them.
   */
  patchMobileTemplate: (value: string) => void;
  /** One field of the resolved mobile chrome (slot editor). */
  patchMobile: (p: Partial<MobileChrome>) => void;
  patchAnnouncement: (p: Partial<AnnouncementDraft>) => void;
  patchCampaignStrip: (p: Partial<CampaignStripDraft>) => void;
  patchContactButton: (p: Partial<ContactButtonDraft>) => void;
  /**
   * Stage a ready-made theme as an unsaved edit — the preview repaints, Discard
   * undoes it, Save confirms. Returns false for an unknown id.
   */
  applyTheme: (themeId: string) => boolean;
  /** Parts whose values differ from what the server last confirmed. */
  dirtyParts: PartId[];
  isDirty: boolean;
  /** Human-readable validation failures that block the single Save action. */
  validationErrors: string[];
  isValid: boolean;
  discard: () => void;
  save: () => void;
  saving: boolean;
  /** Save writes the Site's draft, not the live store — the store publishes its look. */
  savesDraft: boolean;
}

/**
 * The single source of truth for the Customize page: one draft, one dirty map,
 * one save. Replaces the three per-section drafts and their five separate save
 * buttons — a merchant now presses Save once and everything they touched ships.
 */
export function useCustomizeDraft(
  settings: StorefrontSettings,
  /** Present once the store publishes its look through the Site; `settings` then already carries the Site's look. */
  site?: StorefrontSite,
): CustomizeDraftApi {
  const saveSettings = useUpdateStorefrontSettings();
  const saveSiteDraft = useSaveStorefrontSiteDraft();
  const updateCollection = useUpdateCollection();
  const reorderCollections = useReorderCollections();
  const { data: fetchedCollections } = useStorefrontCollections();

  const [draft, setDraft] = useState<CustomizeDraft>(() => ({
    ...seedDraft(settings),
    collections: [],
  }));
  const [baseline, setBaseline] = useState<CustomizeDraft>(draft);

  const dirtyParts = useMemo(() => changedParts(draft, baseline), [draft, baseline]);
  const isDirty = dirtyParts.length > 0;
  const validationErrors = useMemo(() => validateCustomizeDraft(draft), [draft]);
  const isValid = validationErrors.length === 0;
  // A theme can change the collection PAGE template while the category query is
  // still loading. That is not an edit to the category rows and must not prevent
  // those rows from hydrating when the request completes.
  const collectionRowsDirty = haveCollectionRowsChanged(draft, baseline);

  // The draft is seeded once, but `settings` keeps arriving — a media upload
  // PATCHes immediately and invalidates the query, and the page can sit open for
  // a long time. Re-seed a CLEAN draft from the newer document, exactly as the
  // collections block below does: without this the page holds an increasingly
  // old copy of `templates`/`nav`/`heroSlides` and its wholesale PATCH pushes it
  // back over whatever landed since. A dirty part is never touched — the
  // merchant's unsaved work outranks a background refetch.
  const [seededSettings, setSeededSettings] = useState(settings);
  if (settings !== seededSettings) {
    setSeededSettings(settings);
    if (!isDirty) {
      const fresh = { ...seedDraft(settings), collections: draft.collections };
      setDraft(fresh);
      setBaseline(fresh);
    }
  }

  // Collections arrive after the settings do. Seed the draft from them during
  // render (the "adjust state on prop change" pattern — an effect that mirrors
  // fetched data into state causes a cascading re-render), but never over the
  // merchant's own unsaved edits: a background refetch would otherwise silently
  // undo a rename they had not saved yet.
  const [seededFrom, setSeededFrom] = useState<typeof fetchedCollections>(undefined);
  if (fetchedCollections && fetchedCollections !== seededFrom) {
    setSeededFrom(fetchedCollections);
    if (!collectionRowsDirty) {
      const rows = fetchedCollections.map(toRowValue);
      setDraft((d) => ({ ...d, collections: rows }));
      setBaseline((b) => ({ ...b, collections: rows }));
    }
  }

  const patch = useCallback(
    (p: Partial<CustomizeDraft>) => setDraft((d) => ({ ...d, ...p })),
    [],
  );
  const patchTemplate = useCallback(
    (key: string, value: string) =>
      setDraft((d) => ({ ...d, templates: { ...d.templates, [key]: value } })),
    [],
  );
  const patchHomeTemplate = useCallback(
    (value: string) => setDraft((d) => ({ ...d, ...applyHomeTemplateToDraft(d, value) })),
    [],
  );
  const patchMobileTemplate = useCallback((value: string) => {
    // The picked template's own values, wholesale — see `patchMobileTemplate`
    // on the api interface for why this is a reset rather than a merge.
    const next = mobileTemplate(value);
    setDraft((d) => ({
      ...d,
      templates: { ...d.templates, mobile: next.id },
      mobile: resolveMobileChrome({ mobile: next.id }, undefined),
    }));
  }, []);
  const patchMobile = useCallback(
    (p: Partial<MobileChrome>) =>
      setDraft((d) => ({ ...d, mobile: { ...d.mobile, ...p } })),
    [],
  );
  const applyTheme = useCallback((themeId: string) => {
    const theme = getReadyMadeTheme(themeId);
    if (!theme) return false;
    setDraft((d) => ({ ...d, ...applyThemeToDraft(d, theme) }));
    return true;
  }, []);
  const patchAnnouncement = useCallback(
    (p: Partial<AnnouncementDraft>) =>
      setDraft((d) => ({ ...d, announcement: { ...d.announcement, ...p } })),
    [],
  );
  const patchCampaignStrip = useCallback(
    (p: Partial<CampaignStripDraft>) =>
      setDraft((d) => ({ ...d, campaignStrip: { ...d.campaignStrip, ...p } })),
    [],
  );
  const patchContactButton = useCallback(
    (p: Partial<ContactButtonDraft>) =>
      setDraft((d) => ({ ...d, contactButton: { ...d.contactButton, ...p } })),
    [],
  );

  const discard = useCallback(() => setDraft(baseline), [baseline]);

  // The page owns real unsaved work and there is no route-level guard in the
  // app, so a closed tab used to lose it without a word.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = useCallback(async () => {
    if (!isValid) return;
    const d = draft;
    try {
      // Collections first: they are Category docs behind their own endpoints.
      // Only the rows that actually changed are sent, and each one is silenced
      // so a single Save produces a single toast rather than one per row.
      const base = baseline.collections;
      const touched = d.collections.filter((c) => {
        const was = base.find((b) => b._id === c._id);
        return !!was && (was.displayName !== c.displayName || was.isListed !== c.isListed);
      });
      for (const c of touched) {
        await updateCollection.mutateAsync({
          id: c._id,
          displayName: c.displayName.trim(),
          isListed: c.isListed,
          silent: true,
        });
      }
      const orderChanged =
        d.collections.length !== base.length ||
        d.collections.some((c, i) => c._id !== base[i]?._id);
      if (orderChanged) {
        await reorderCollections.mutateAsync(d.collections.map((c) => c._id));
      }

      // Only dirty top-level settings blocks are sent. Nested blocks replace
      // wholesale on the backend, so the builder still sends each selected
      // block completely; untouched blocks never cross the wire at all.
      const settingsPatch = toSettingsPatch(d, dirtyParts);
      const hasPatch = Object.keys(settingsPatch).length > 0;
      // A store that publishes its look saves into the Site's draft, and shoppers
      // see it once the merchant publishes (`SitePublishBar`). Every other store
      // saves straight to shoppers.
      let saved: StorefrontSettings | undefined = settings;
      if (hasPatch && site) {
        const res = await saveSiteDraft.mutateAsync({
          look: settingsPatch,
          draftVersion: site.draftVersion,
        });
        saved = res.data ? settingsWithSiteLook(settings, res.data) : undefined;
      } else if (hasPatch) {
        saved = (await saveSettings.mutateAsync(settingsPatch)).data;
      }

      // Re-seed from the saved response rather than from the draft, so the rail
      // shows what the store actually has — completely empty slides and blank
      // footer groups were dropped on the way, and pretending otherwise is how
      // the old page ended up previewing columns that never shipped.
      if (saved) {
        const fresh = { ...seedDraft(saved), collections: d.collections };
        setDraft(fresh);
        setBaseline(fresh);
      } else {
        setBaseline(d);
      }
    } catch {
      // handleMutationError already toasted; keep the draft so nothing is lost.
    }
  }, [
    draft,
    dirtyParts,
    baseline.collections,
    reorderCollections,
    saveSettings,
    saveSiteDraft,
    settings,
    site,
    updateCollection,
    isValid,
  ]);

  return {
    draft,
    patch,
    patchTemplate,
    patchHomeTemplate,
    patchMobileTemplate,
    patchMobile,
    patchAnnouncement,
    patchCampaignStrip,
    patchContactButton,
    applyTheme,
    dirtyParts,
    isDirty,
    validationErrors,
    isValid,
    discard,
    save: () => void save(),
    saving:
      saveSettings.isPending ||
      saveSiteDraft.isPending ||
      updateCollection.isPending ||
      reorderCollections.isPending,
    savesDraft: !!site,
  };
}

/** Validate values whose invalid form would make CSS declarations disappear. */
export function validateCustomizeDraft(draft: CustomizeDraft): string[] {
  const errors: string[] = [];
  if (!isValidHexColor(draft.brandColor, false)) errors.push("Brand colour is invalid");
  if (!isValidHexColor(draft.accentColor, false)) errors.push("Accent colour is invalid");
  if (!isValidHexColor(draft.logoStyle.background ?? "")) errors.push("Logo backdrop is invalid");
  if (!isValidHexColor(draft.announcement.bgColor, false)) errors.push("Announcement background is invalid");
  if (!isValidHexColor(draft.announcement.textColor)) errors.push("Announcement text colour is invalid");
  if (!isValidHexColor(draft.announcement.overlay)) errors.push("Announcement overlay is invalid");
  // Both blank-allowed: an empty colour is the documented "follow the theme".
  if (!isValidHexColor(draft.campaignStrip.bgColor)) errors.push("Campaign strip background is invalid");
  if (!isValidHexColor(draft.campaignStrip.textColor)) errors.push("Campaign strip text colour is invalid");
  return errors;
}
