// coding-standard: maintained

import {
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DEFAULT_DESIGN,
  DESIGN_NAV_HOVERS,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_WIDTHS,
} from "@/lib/storefront-theme";
import { whatsappNumberLabel } from "@/lib/whatsapp-number";
import { hasHeroSlideContent } from "@/lib/storefront-hero-slide";
import type { StorefrontSettings } from "@/types";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import type {
  CustomizeDraft,
  PartId,
} from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The collapsed face of every part of the rail.
 *
 * With all ten collapsed the rail reads as an audit of the whole storefront —
 * a merchant can answer "what does my shop look like right now?" without
 * opening anything, which is what the old three-tab layout could never do.
 * Each line describes what the shop HAS; never an instruction.
 */
const labelOf = (key: string, value: string) =>
  TEMPLATE_OPTIONS[key]?.find((o) => o.value === value)?.label ?? value;

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * One design ramp, but only when the merchant moved it off the default —
 * see the note in the `look` summary. `noun` names what the step applies to
 * ("Statement headings"); page width already reads as one ("Full width").
 */
const ramp = (
  options: { id: string; label: string }[],
  value: string | undefined,
  fallback: string,
  noun?: string,
): string => {
  if (!value || value === fallback) return "";
  const label = options.find((o) => o.id === value)?.label ?? value;
  return noun ? `${label} ${noun}` : label;
};

/**
 * The per-breakpoint half of a strip's summary. Empty when it shows on both,
 * so the common case does not pay for a clause that says nothing.
 */
function stripWhere(showOnDesktop: boolean, showOnMobile: boolean): string {
  if (showOnDesktop && showOnMobile) return "";
  if (!showOnDesktop && !showOnMobile) return "hidden on every screen";
  return showOnDesktop ? "desktop only" : "mobile only";
}

export function partSummary(
  id: PartId,
  draft: CustomizeDraft,
  settings: StorefrontSettings,
  orgHasLogo: boolean,
): string {
  const listed = draft.collections.filter((c) => c.isListed).length;

  switch (id) {
    case "look": {
      const surface = DESIGN_SURFACES.find((o) => o.id === draft.design.surface);
      const font = DESIGN_FONTS.find((o) => o.id === draft.design.font);
      const logo = settings.logo
        ? "custom logo"
        : orgHasLogo
          ? "organization logo"
          : "no logo";
      /* Three facts, then only the ramps a merchant actually moved.
         `brand` and `design` used to be two rows summarising eight settings
         between them, and listing all eight here would have made the longest
         line in the rail out of the part with the lowest adoption. The four
         ramps sit at their default on nearly every shop, so spelling them out
         said "Balanced headings · Cozy spacing · Soft corners" on a shop whose
         owner had chosen none of it — noise in a line whose whole job is to
         report what this shop HAS. Off their default they are exactly the
         opposite, so they are appended then.
         The brand colour is not here either: the row already carries it as a
         live gradient swatch, and a hex code reads to nobody. */
      const moved = [
        ramp(DESIGN_SCALES, draft.design.scale, DEFAULT_DESIGN.scale, "headings"),
        ramp(DESIGN_DENSITIES, draft.design.density, DEFAULT_DESIGN.density, "spacing"),
        ramp(DESIGN_RADII, draft.design.radius, DEFAULT_DESIGN.radius, "corners"),
        ramp(DESIGN_WIDTHS, draft.design.width, DEFAULT_DESIGN.width),
      ].filter(Boolean);
      return [
        surface?.label ?? draft.design.surface,
        font?.label ?? draft.design.font,
        logo,
        ...moved,
      ].join(" · ");
    }
    case "announcement": {
      if (!draft.announcement.enabled) return "Off";
      const where = stripWhere(
        draft.announcement.showOnDesktop,
        draft.announcement.showOnMobile,
      );
      const message = draft.announcement.text.trim()
        ? `On — “${draft.announcement.text.trim()}”`
        : "On, but no message written yet";
      // Worth a word in the collapsed row: it is the one announcement setting
      // that changes how the bar BEHAVES rather than how it looks.
      const scroll = draft.announcement.marquee ? "Scrolling" : "";
      return [message, scroll, where].filter(Boolean).join(" · ");
    }
    case "campaign": {
      const c = draft.campaignStrip;
      if (!c.enabled) return "Off";
      const where = stripWhere(c.showOnDesktop, c.showOnMobile);
      const pages = c.showOn === "home" ? "Home page only" : "All pages";
      // Deliberately says "when a campaign is running": the strip is invisible
      // with no live campaign, and a merchant reading "On" against an empty
      // storefront would go looking for a bug that isn't there.
      return [`On when a campaign is running · ${pages}`, where]
        .filter(Boolean)
        .join(" · ");
    }
    case "header": {
      const menu =
        draft.templates.headerMenu === "collections"
          ? `menu from ${count(listed, "collection")}`
          : `${count(draft.navHeader.filter((i) => i.label.trim()).length, "custom link")}`;
      /* Hover is appended only once it has been moved off `none`, the same
         rule the Look ramps follow: on the shop that never opened the control
         it would report a setting nobody made. */
      const hover = [
        ramp(DESIGN_NAV_HOVERS, draft.design.navHover, DEFAULT_DESIGN.navHover),
        ramp(
          DESIGN_NAV_HOVERS,
          draft.design.navChildHover,
          DEFAULT_DESIGN.navChildHover,
        ),
      ].filter(Boolean);
      const hoverNote = hover.length
        ? ` · ${[...new Set(hover)].join("/")} hover`
        : "";
      return `${labelOf("header", draft.templates.header)} · ${menu}${hoverNote}`;
    }
    case "utility": {
      const u = draft.utilityBar;
      if (!u.enabled) return "Off";
      const where = stripWhere(u.showOnDesktop, u.showOnMobile);
      const items = [
        u.showPhone,
        u.showTrackOrder,
        u.showLanguage,
        u.showTheme,
      ].filter(Boolean).length;
      return [`On · ${count(items, "item")}`, where].filter(Boolean).join(" · ");
    }
    case "cards":
      return `${labelOf("productCard", draft.templates.productCard)} · ${labelOf(
        "cardActions",
        draft.templates.cardActions,
      )}`;
    case "contact": {
      const c = draft.contactButton;
      if (!c.enabled) return "Off";
      // Owners usually paste WhatsApp's share LINK, not a number — showing it
      // raw truncates to a meaningless "…end/?phone=8801…".
      const number = whatsappNumberLabel(settings.social?.whatsapp);
      // On with no number resolves to no button at all on the live shop, so the
      // summary says that rather than reporting a healthy "On".
      if (!number) return "On, but no WhatsApp number saved";
      const where =
        c.showOn.length === 0 ? "every page" : `${count(c.showOn.length, "page")}`;
      return `${number} · ${where} · bottom ${c.position}`;
    }
    case "footer": {
      const groups = draft.footerGroups.filter((g) => g.title.trim()).length;
      const links = groups === 0 ? "no link groups" : count(groups, "link group");
      return `${labelOf("footer", draft.templates.footer)} · ${links}`;
    }
    /* The whole-page layouts. They shipped after this switch was written and
       were never added to it, so each rendered a BLANK line in the rail — which
       quietly broke the promise in this file's own docstring, that all parts
       collapsed read as an audit of the shop. `shell` is the one worth having
       most: it is the axis that decides what kind of site this is. The four
       that named ONE page (product, collection, cart, checkout, account) left
       with their rows on 2026-09-20. */
    case "content":
      return labelOf("contentLayout", draft.templates.contentLayout);
    case "shell":
      return labelOf("shell", draft.templates.shell);
    case "mobile": {
      const m = draft.mobile;
      /* Names the layout, then the two facts a merchant is actually checking:
         whether their phone has a bottom bar, and whether search is on screen.
         Not a list of every slot — the live preview beside the rail already
         shows the arrangement far better than a sentence can. */
      const tabs = m.tabs.length
        ? `${count(m.tabs.length, "tab")} at the bottom`
        : "no bottom bar";
      const search = m.searchInline
        ? "search in the bar"
        : m.row === "search"
          ? "search under it"
          : m.row === "chips"
            ? "category strip"
            : "";
      return [labelOf("mobile", draft.templates.mobile), tabs, search]
        .filter(Boolean)
        .join(" · ");
    }
  }
}
