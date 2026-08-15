"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReorderCollections,
  useStorefrontCollections,
  useUpdateCollection,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { DEFAULT_HOME_ROWS } from "@/lib/storefront-home-rows";
import { getPreset } from "@/lib/storefront-theme";
import { resolveHeaderMenu } from "@/lib/storefront-templates";
import type {
  ContactButtonPage,
  Image,
  StorefrontFooterGroup,
  StorefrontHeroBanner,
  StorefrontHeroSlide,
  StorefrontHomeCollections,
  StorefrontHomeRow,
  StorefrontLogoStyle,
  StorefrontMenuItem,
  StorefrontSettings,
  StorefrontTrustBadge,
} from "@/types";
import { toSettingsPayload } from "@/components/ecommerce/customize/draft-payloads";
import { DEFAULT_BADGES } from "@/components/ecommerce/customize/trust-badges-field";
import {
  RETIRED_TEMPLATE_KEYS,
  TEMPLATE_OPTIONS,
} from "@/components/ecommerce/customize/template-options";
import {
  toRowValue,
  type CollectionRowValue,
} from "@/components/ecommerce/collections/collection-row";

/** Announcement-bar draft — every field always defined, so inputs stay controlled. */
export interface AnnouncementDraft {
  enabled: boolean;
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
  icon: string;
  ctaLabel: string;
  dismissible: boolean;
  size: "sm" | "md" | "lg";
  bgImage: Image | null;
  overlay: string;
  overlayOpacity: number;
  bgFit: "cover" | "tile";
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
  hoursEnabled: boolean;
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
  /** Homepage collections row layout (Customize → Collections). */
  homeCollections: StorefrontHomeCollections;
  /**
   * The homepage's product rows, in render order (Customize → Home page).
   *
   * Always a real array here, never `undefined`: a store that has never been
   * customized is seeded with the two built-in rows so the panel opens on the
   * layout the shopper is already seeing. The absent-vs-empty distinction the
   * storefront cares about is made on the way OUT — an empty draft ships as an
   * empty array, which is a merchant who cleared every row.
   */
  homeRows: StorefrontHomeRow[];
  /** Every `templates.*` id, including `hero` and `headerMenu`. */
  templates: Record<string, string>;
  badges: StorefrontTrustBadge[];
  heroSlides: StorefrontHeroSlide[];
  heroBanner: StorefrontHeroBanner;
  navHeader: StorefrontMenuItem[];
  announcement: AnnouncementDraft;
  contactButton: ContactButtonDraft;
  footerGroups: StorefrontFooterGroup[];
  footerContentPages: FooterContentPagesDraft;
  /** Bottom-bar note; empty ⇒ the storefront prints the store's currency. */
  footerNote: string;
  /** Contact-first heading; empty ⇒ the localized "Order by phone". */
  footerContactHeading: string;
  footerNewsletter: FooterNewsletterDraft;
  /** Category docs, not settings — saved through their own mutations. */
  collections: CollectionRowValue[];
}

/** One row of the rail. Order = the order a shopper meets the part. */
export type PartId =
  | "brand"
  | "announcement"
  | "header"
  | "hero"
  | "home"
  | "cards"
  | "collections"
  | "product"
  | "contact"
  | "footer"
  | "checkout";

/**
 * Which slice of the draft each part owns. Dirty state is derived by comparing
 * these against the baseline rather than set by hand, so a new field in a part
 * is covered the moment it is added to the slice — there is no `setDirty()` call
 * to forget.
 */
const PART_SLICE: Record<PartId, (d: CustomizeDraft) => unknown> = {
  brand: (d) => [d.preset, d.brandColor, d.accentColor, d.logoStyle],
  announcement: (d) => d.announcement,
  header: (d) => [d.templates.header, d.templates.headerMenu, d.navHeader],
  hero: (d) => [d.templates.hero, d.heroSlides, d.heroBanner],
  home: (d) => [d.templates.home, d.homeRows],
  cards: (d) => [d.templates.productCard, d.templates.cardActions, d.templates.imageFit],
  collections: (d) => [
    d.collections,
    d.templates.collection,
    d.templates.pagination,
    d.homeCollections,
  ],
  product: (d) => d.templates.product,
  contact: (d) => d.contactButton,
  footer: (d) => [
    d.templates.footer,
    d.footerText,
    d.footerNote,
    d.footerContactHeading,
    d.footerNewsletter,
    d.badges,
    d.footerGroups,
    d.footerContentPages,
  ],
  checkout: (d) => d.templates.checkout,
};

const PART_IDS = Object.keys(PART_SLICE) as PartId[];

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
 * `channels` is deliberately NOT surfaced: the number lives at Settings →
 * General and has exactly one home, so the editor has nothing to seed from it.
 * When a second `kind` is registered this grows a channel list, and this
 * function is where that starts.
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
    hoursEnabled: h?.enabled ?? false,
    hoursFrom: h?.from ?? "10:00",
    hoursTo: h?.to ?? "20:00",
    offlineNote: h?.offlineNote ?? "",
    nudgeEnabled: n?.enabled ?? false,
    nudgeText: n?.text ?? "",
    nudgeDelay: n?.delaySeconds ?? 8,
  };
}

function seedDraft(settings: StorefrontSettings): Omit<CustomizeDraft, "collections"> {
  const t = settings.theme ?? {};
  const presetDefaults = getPreset(t.preset);
  const a = settings.nav?.announcement;
  return {
    preset: t.preset ?? "default",
    brandColor: t.brandColor ?? presetDefaults.brandColor,
    accentColor: t.accentColor ?? presetDefaults.accentColor,
    footerText: t.footerText ?? "",
    // Seeded as the saved object, empty when unset — an absent field means
    // "leave it as it was", which is exactly what the resolvers default to.
    logoStyle: t.logo ?? {},
    homeCollections: t.homeCollections ?? {},
    // `?? DEFAULT_HOME_ROWS` mirrors the storefront's own fallback, so the panel
    // lists exactly the rows the shop is rendering rather than opening empty on
    // a homepage that visibly has products.
    homeRows: t.homeRows ?? DEFAULT_HOME_ROWS,
    templates: seedTemplates(settings),
    // Three fixed slots seeded by index — an empty slot keeps its default badge.
    badges: DEFAULT_BADGES.map((d, i) => ({
      text: settings.trustBadges?.[i]?.text ?? "",
      icon: settings.trustBadges?.[i]?.icon ?? d.icon,
    })),
    heroSlides: settings.heroSlides ?? [],
    heroBanner: settings.heroBanner ?? {},
    navHeader: settings.nav?.header ?? [],
    announcement: {
      enabled: a?.enabled ?? false,
      text: a?.text ?? "",
      link: a?.link ?? "",
      bgColor: a?.bgColor ?? "#2563eb",
      textColor: a?.textColor ?? "",
      icon: a?.icon ?? "",
      ctaLabel: a?.ctaLabel ?? "",
      dismissible: a?.dismissible ?? false,
      size: a?.size ?? "sm",
      bgImage: a?.bgImage ?? null,
      overlay: a?.overlay ?? "#000000",
      overlayOpacity: a?.overlayOpacity ?? 40,
      bgFit: a?.bgFit ?? "cover",
    },
    contactButton: seedContactButton(settings),
    footerGroups: settings.nav?.footer ?? [],
    // `show` defaults on (legacy behaviour) so existing stores keep the column;
    // a blank title ⇒ the built-in "Information" heading.
    footerContentPages: {
      show: settings.nav?.footerContentPages?.show ?? true,
      title: settings.nav?.footerContentPages?.title ?? "",
    },
    footerNote: t.footerNote ?? "",
    footerContactHeading: t.footerContactHeading ?? "",
    footerNewsletter: {
      heading: t.footerNewsletter?.heading ?? "",
      blurb: t.footerNewsletter?.blurb ?? "",
      buttonLabel: t.footerNewsletter?.buttonLabel ?? "",
    },
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export interface CustomizeDraftApi {
  draft: CustomizeDraft;
  patch: (p: Partial<CustomizeDraft>) => void;
  patchTemplate: (key: string, value: string) => void;
  patchAnnouncement: (p: Partial<AnnouncementDraft>) => void;
  patchContactButton: (p: Partial<ContactButtonDraft>) => void;
  patchContentPages: (p: Partial<FooterContentPagesDraft>) => void;
  /** Parts whose values differ from what the server last confirmed. */
  dirtyParts: PartId[];
  isDirty: boolean;
  discard: () => void;
  save: () => void;
  saving: boolean;
}

/**
 * The single source of truth for the Customize page: one draft, one dirty map,
 * one save. Replaces the three per-section drafts and their five separate save
 * buttons — a merchant now presses Save once and everything they touched ships.
 */
export function useCustomizeDraft(settings: StorefrontSettings): CustomizeDraftApi {
  const saveSettings = useUpdateStorefrontSettings();
  const updateCollection = useUpdateCollection();
  const reorderCollections = useReorderCollections();
  const { data: fetchedCollections } = useStorefrontCollections();

  const [draft, setDraft] = useState<CustomizeDraft>(() => ({
    ...seedDraft(settings),
    collections: [],
  }));
  const [baseline, setBaseline] = useState<CustomizeDraft>(draft);

  const dirtyParts = useMemo(
    () => PART_IDS.filter((id) => !same(PART_SLICE[id](draft), PART_SLICE[id](baseline))),
    [draft, baseline],
  );
  const isDirty = dirtyParts.length > 0;

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
    if (!dirtyParts.includes("collections")) {
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
  const patchAnnouncement = useCallback(
    (p: Partial<AnnouncementDraft>) =>
      setDraft((d) => ({ ...d, announcement: { ...d.announcement, ...p } })),
    [],
  );
  const patchContactButton = useCallback(
    (p: Partial<ContactButtonDraft>) =>
      setDraft((d) => ({ ...d, contactButton: { ...d.contactButton, ...p } })),
    [],
  );
  const patchContentPages = useCallback(
    (p: Partial<FooterContentPagesDraft>) =>
      setDraft((d) => ({ ...d, footerContentPages: { ...d.footerContentPages, ...p } })),
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

      // Then one settings PATCH carrying theme, templates and nav together,
      // trimmed by the same builder the live preview uses (`draft-payloads`) so
      // what the merchant judged is exactly what ships.
      const res = await saveSettings.mutateAsync(toSettingsPayload(d));

      // Re-seed from the saved response rather than from the draft, so the rail
      // shows what the store actually has — untitled slides and blank footer
      // groups were dropped on the way, and pretending otherwise is how the old
      // page ended up previewing columns that never shipped.
      if (res.data) {
        const fresh = { ...seedDraft(res.data), collections: d.collections };
        setDraft(fresh);
        setBaseline(fresh);
      } else {
        setBaseline(d);
      }
    } catch {
      // handleMutationError already toasted; keep the draft so nothing is lost.
    }
  }, [draft, baseline.collections, reorderCollections, saveSettings, updateCollection]);

  return {
    draft,
    patch,
    patchTemplate,
    patchAnnouncement,
    patchContactButton,
    patchContentPages,
    dirtyParts,
    isDirty,
    discard,
    save: () => void save(),
    saving:
      saveSettings.isPending ||
      updateCollection.isPending ||
      reorderCollections.isPending,
  };
}
