"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReorderCollections,
  useStorefrontCollections,
  useUpdateCollection,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { getPreset } from "@/lib/storefront-theme";
import { resolveHeaderMenu } from "@/lib/storefront-templates";
import type {
  Image,
  StorefrontFooterGroup,
  StorefrontHeroBanner,
  StorefrontHeroSlide,
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

/** The auto content-pages footer column (show + heading override). */
export interface FooterContentPagesDraft {
  show: boolean;
  title: string;
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
  /** Every `templates.*` id, including `hero` and `headerMenu`. */
  templates: Record<string, string>;
  /**
   * Ordered ids of the homepage sections that render.
   *
   * `null` is not "empty" — it means **the merchant has never reordered the
   * homepage**, which is what makes the storefront fall back to the default
   * order of whichever look they chose. The editor shows that resolved order but
   * leaves this `null` until they actually move or switch something off, and the
   * save payload omits the key while it is `null`. Writing the resolved order
   * eagerly would freeze every store into its current look's list the first time
   * its owner saved anything at all.
   */
  homepageSections: string[] | null;
  badges: StorefrontTrustBadge[];
  heroSlides: StorefrontHeroSlide[];
  heroBanner: StorefrontHeroBanner;
  navHeader: StorefrontMenuItem[];
  announcement: AnnouncementDraft;
  footerGroups: StorefrontFooterGroup[];
  footerContentPages: FooterContentPagesDraft;
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
  | "footer"
  | "checkout";

/**
 * Which slice of the draft each part owns. Dirty state is derived by comparing
 * these against the baseline rather than set by hand, so a new field in a part
 * is covered the moment it is added to the slice — there is no `setDirty()` call
 * to forget.
 */
const PART_SLICE: Record<PartId, (d: CustomizeDraft) => unknown> = {
  brand: (d) => [d.preset, d.brandColor, d.accentColor],
  announcement: (d) => d.announcement,
  header: (d) => [d.templates.header, d.templates.headerMenu, d.navHeader],
  hero: (d) => [d.templates.hero, d.heroSlides, d.heroBanner],
  home: (d) => [d.templates.home, d.homepageSections],
  cards: (d) => [d.templates.productCard, d.templates.cardActions],
  collections: (d) => [d.collections, d.templates.collection, d.templates.pagination],
  product: (d) => d.templates.product,
  footer: (d) => [
    d.templates.footer,
    d.footerText,
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

function seedDraft(settings: StorefrontSettings): Omit<CustomizeDraft, "collections"> {
  const t = settings.theme ?? {};
  const presetDefaults = getPreset(t.preset);
  const a = settings.nav?.announcement;
  return {
    preset: t.preset ?? "default",
    brandColor: t.brandColor ?? presetDefaults.brandColor,
    accentColor: t.accentColor ?? presetDefaults.accentColor,
    footerText: t.footerText ?? "",
    templates: seedTemplates(settings),
    // Deliberately NOT defaulted to the look's order — see the field's doc.
    homepageSections: t.homepageSections ?? null,
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
    footerGroups: settings.nav?.footer ?? [],
    // `show` defaults on (legacy behaviour) so existing stores keep the column;
    // a blank title ⇒ the built-in "Information" heading.
    footerContentPages: {
      show: settings.nav?.footerContentPages?.show ?? true,
      title: settings.nav?.footerContentPages?.title ?? "",
    },
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export interface CustomizeDraftApi {
  draft: CustomizeDraft;
  patch: (p: Partial<CustomizeDraft>) => void;
  patchTemplate: (key: string, value: string) => void;
  patchAnnouncement: (p: Partial<AnnouncementDraft>) => void;
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
