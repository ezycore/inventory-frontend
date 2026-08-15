// coding-standard: maintained

import type {
  HeaderMenuSource,
  StoreContactButton,
} from "@/lib/storefront-client";
import type {
  Image,
  StorefrontContactButton,
  StorefrontFooterGroup,
  StorefrontHeroSlide,
  StorefrontMenuItem,
  StorefrontNav,
  UpdateStorefrontSettingsDto,
} from "@/types";
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

/**
 * Sign-up copy, blanks dropped. Sends `undefined` for the whole block when the
 * merchant filled none of it, so the stored document stays absent rather than
 * holding three empty strings that read as "set to nothing".
 */
const trimNewsletter = (n: CustomizeDraft["footerNewsletter"]) => {
  const block = {
    heading: n.heading.trim() || undefined,
    blurb: n.blurb.trim() || undefined,
    buttonLabel: n.buttonLabel.trim() || undefined,
  };
  return Object.values(block).some(Boolean) ? block : undefined;
};

const trimBadges = (badges: CustomizeDraft["badges"]) =>
  // All three slots are kept (empty = the storefront's default copy) so their
  // positions survive a reload.
  badges.map((b) => ({ text: b.text.trim(), icon: b.icon }));

/**
 * Listed collections only, display name winning, draft order preserved —
 * mirrors the public `GET /:slug/categories` contract exactly.
 *
 * "Exactly" is load-bearing and was **not** true between 2026-08-06 and
 * 2026-08-07: this emitted a FLAT `{_id, name, slug}` list while the endpoint had
 * become a two-level tree carrying `slugPath`. The storefront drops a node with
 * no `slugPath` (it cannot be linked), so the live preview rendered an EMPTY
 * header menu the moment the header source was set to "collections" — the editor
 * looked broken while the saved shop was fine.
 *
 * Two rules to keep, both mirroring the service:
 *  - a node with no `slugPath` is dropped, not emitted as a dead link;
 *  - an unlisted parent takes its children with it (they are unreachable by path
 *    anyway, so advertising them would produce dead links).
 */
export const publicCollections = (collections: CustomizeDraft["collections"]) => {
  const linkable = collections.filter((c) => c.isListed && c.slugPath);
  const shape = (c: CustomizeDraft["collections"][number]) => ({
    _id: c._id,
    name: c.displayName.trim() || c.name,
    slug: c.slug,
    slugPath: c.slugPath,
  });
  return linkable
    .filter((c) => !c.parentId)
    .map((parent) => ({
      ...shape(parent),
      children: linkable.filter((c) => c.parentId === parent._id).map(shape),
    }));
};

/**
 * The editor's flat contact draft, back into the stored `channels` shape.
 *
 * `channels` is sent EMPTY on purpose. The editor no longer offers a per-button
 * number — it lives at Settings → General — so there is no override to store,
 * and `resolvePublicContactButton` synthesises the WhatsApp row from
 * `social.whatsapp` for exactly this case.
 */
function toContactButton(draft: CustomizeDraft): StorefrontContactButton {
  const c = draft.contactButton;
  return {
    enabled: c.enabled,
    label: c.label.trim() || undefined,
    greeting: c.greeting.trim() || undefined,
    position: c.position,
    // Empty ⇒ every page. Sent as undefined rather than `[]` so the stored doc
    // says "unset" instead of "an empty whitelist someone might later read
    // literally".
    showOn: c.showOn.length ? c.showOn : undefined,
    channels: [],
    hours: {
      enabled: c.hoursEnabled,
      from: c.hoursFrom,
      to: c.hoursTo,
      offlineNote: c.offlineNote.trim() || undefined,
    },
    nudge: {
      enabled: c.nudgeEnabled,
      delaySeconds: c.nudgeDelay,
      text: c.nudgeText.trim() || undefined,
    },
  };
}

/**
 * The same draft as the PUBLIC shape the storefront renders — i.e. what
 * `resolvePublicContactButton` would return for it.
 *
 * Mirroring that resolver is the point: the preview has to hide the launcher in
 * exactly the cases the live shop would (switched off, or no number anywhere),
 * or the merchant judges a button their shoppers will never see. The one thing
 * it cannot mirror is the `social.whatsapp` fallback — that value is not in this
 * draft — so the caller passes it in.
 */
function toPreviewContactButton(
  draft: CustomizeDraft,
  socialWhatsapp: string | undefined,
): StoreContactButton | null {
  const c = draft.contactButton;
  if (!c.enabled) return null;
  const value = socialWhatsapp?.trim() || "";
  if (!value) return null;
  return {
    label: c.label.trim() || undefined,
    greeting: c.greeting.trim() || undefined,
    position: c.position,
    showOn: c.showOn.length ? c.showOn : undefined,
    channels: [{ kind: "whatsapp", value }],
    hours: {
      enabled: c.hoursEnabled,
      from: c.hoursFrom,
      to: c.hoursTo,
      offlineNote: c.offlineNote.trim() || undefined,
    },
    nudge: {
      enabled: c.nudgeEnabled,
      delaySeconds: c.nudgeDelay,
      text: c.nudgeText.trim() || undefined,
    },
  };
}

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
      logo: draft.logoStyle,
      homeCollections: draft.homeCollections,
      design: draft.design,
      // Empty ⇒ `undefined`, never `[]`. An empty array would persist as "this
      // shop shows no sections at all", where unset means "use the default the
      // home template implies" — the difference between a blank page and a
      // normal one for any merchant who switches every section off.
      homepageSections: draft.homepageSections.length
        ? draft.homepageSections
        : undefined,
      // ⚠ Not editable here, and that is exactly why it must be listed. This
      // object literal IS the new `theme`: the backend does `Object.assign` with
      // documented "each provided sub-field replaces the existing one" semantics,
      // so anything the draft omits is deleted on the next Save. A ready-made
      // theme writes this field; without this line the first unrelated edit a
      // merchant made would silently forget which theme their store is on.
      appliedThemeId: draft.appliedThemeId,
    },
    // Merchant-written wording, sent as its OWN block. Keeping it out of `theme`
    // is what lets a ready-made theme replace the look wholesale without
    // touching a word the merchant typed. Each field is `undefined`, never `""`:
    // empty means "use the storefront's localized wording", and an empty string
    // would print a blank line.
    copy: {
      footerText: draft.footerText.trim() || undefined,
      footerNote: draft.footerNote.trim() || undefined,
      footerContactHeading: draft.footerContactHeading.trim() || undefined,
      footerNewsletter: trimNewsletter(draft.footerNewsletter),
    },
    trustBadges: trimBadges(draft.badges),
    heroBanner: cleanHeroBanner(draft.heroBanner),
    heroSlides: trimSlides(draft.heroSlides),
    templates: draft.templates,
    nav: toNav(draft),
    contactButton: toContactButton(draft),
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
    socialWhatsapp,
  }: {
    /** Effective (org-fallback applied) images; `null` = none, and must stay null. */
    logo: Image | null;
    banner: Image | null;
    /** Preview slides / collections while their panel is open, whatever is saved. */
    forceHeroSlides: boolean;
    forceCollectionsMenu: boolean;
    /** Settings → General's number, so the preview can mirror the blank-number fallback. */
    socialWhatsapp?: string;
  },
) {
  return {
    theme: {
      brandColor: draft.brandColor,
      accentColor: draft.accentColor,
      logo: draft.logoStyle,
      homeCollections: draft.homeCollections,
      design: draft.design,
      homepageSections: draft.homepageSections,
    },
    templates: {
      home: draft.templates.home,
      footer: draft.templates.footer,
      header: draft.templates.header,
      productCard: draft.templates.productCard,
      cardActions: draft.templates.cardActions,
      pagination: draft.templates.pagination,
      imageFit: draft.templates.imageFit,
      imageRatio: draft.templates.imageRatio,
      categoryTiles: draft.templates.categoryTiles,
      accountLayout: draft.templates.accountLayout,
      contentLayout: draft.templates.contentLayout,
      cartLayout: draft.templates.cartLayout,
      shell: draft.templates.shell,
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
    heroSlides: trimSlides(draft.heroSlides),
    heroBanner: cleanHeroBanner(draft.heroBanner),
    // Footer copy streams RAW (not `|| undefined`): an empty string is a real
    // draft here — "cleared, so show the localized default" — and collapsing it
    // to undefined would make the preview fall back to the SAVED text instead,
    // so clearing a field would look like it did nothing.
    footerText: draft.footerText,
    footerNote: draft.footerNote,
    footerContactHeading: draft.footerContactHeading,
    footerNewsletter: draft.footerNewsletter,
    nav: toNav(draft),
    // `null` (not undefined) is what tells the preview store the launcher is
    // switched off, as opposed to "nothing drafted yet" — see the store's note.
    contactButton: toPreviewContactButton(draft, socialWhatsapp),
    collections: publicCollections(draft.collections),
    // `null` (not undefined) is what tells the preview store "removed" apart
    // from "not sent yet".
    logo,
    banner,
  };
}
