// coding-standard: maintained

import {
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DEFAULT_DESIGN,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_WIDTHS,
  getPreset,
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

export function partSummary(
  id: PartId,
  draft: CustomizeDraft,
  settings: StorefrontSettings,
  orgHasLogo: boolean,
): string {
  const listed = draft.collections.filter((c) => c.isListed).length;

  switch (id) {
    case "brand": {
      const preset = getPreset(draft.preset);
      const tuned =
        draft.brandColor !== preset.brandColor ||
        draft.accentColor !== preset.accentColor;
      const logo = settings.logo
        ? "custom logo"
        : orgHasLogo
          ? "organization logo"
          : "no logo";
      return `${preset.label}${tuned ? " (tuned)" : ""} · ${draft.brandColor} · ${logo}`;
    }
    case "design": {
      const font = DESIGN_FONTS.find((o) => o.id === draft.design.font);
      const surface = DESIGN_SURFACES.find((o) => o.id === draft.design.surface);
      const scale = DESIGN_SCALES.find((o) => o.id === draft.design.scale);
      const density = DESIGN_DENSITIES.find((o) => o.id === draft.design.density);
      const radius = DESIGN_RADII.find((o) => o.id === draft.design.radius);
      // Width is appended only when it is NOT the default. Five axes already
      // fill this row, and "Contained" on every untouched shop would push the
      // axes a merchant actually changed off the end of the line.
      const width =
        draft.design.width && draft.design.width !== DEFAULT_DESIGN.width
          ? ` · ${DESIGN_WIDTHS.find((o) => o.id === draft.design.width)?.label ?? draft.design.width}`
          : "";
      return `${font?.label ?? draft.design.font} · ${surface?.label ?? draft.design.surface} · ${scale?.label ?? draft.design.scale} headings · ${density?.label ?? draft.design.density} spacing · ${radius?.label ?? draft.design.radius} corners${width}`;
    }
    case "announcement":
      if (!draft.announcement.enabled) return "Off";
      return draft.announcement.text.trim()
        ? `On — “${draft.announcement.text.trim()}”`
        : "On, but no message written yet";
    case "header": {
      const menu =
        draft.templates.headerMenu === "collections"
          ? `menu from ${count(listed, "collection")}`
          : `${count(draft.navHeader.filter((i) => i.label.trim()).length, "custom link")}`;
      return `${labelOf("header", draft.templates.header)} · ${menu}`;
    }
    case "hero": {
      if (draft.templates.home === "minimal") return "Not shown on the Minimal home layout";
      if (draft.templates.hero === "banner") {
        return settings.banner ? "Static banner image" : "Static banner — no image yet";
      }
      const saveable = draft.heroSlides.filter(hasHeroSlideContent).length;
      return saveable === 0
        ? "Slides carousel — no slides yet"
        : `Slides carousel · ${count(saveable, "slide")}`;
    }
    case "home": {
      const option = TEMPLATE_OPTIONS.home.find((o) => o.value === draft.templates.home);
      const label = option?.label ?? draft.templates.home;
      // Once a theme or the merchant has composed the page, the section count is
      // the honest summary — the starting layout is only where it began.
      if (draft.homepageSections.length) {
        return `${label} · ${count(draft.homepageSections.length, "section")}`;
      }
      return option ? `${label} — ${option.description}` : label;
    }
    case "cards":
      return `${labelOf("productCard", draft.templates.productCard)} · ${labelOf(
        "cardActions",
        draft.templates.cardActions,
      )}`;
    case "collections":
      return draft.collections.length === 0
        ? "No categories yet"
        : `${listed} of ${draft.collections.length} listed · ${labelOf(
            "collection",
            draft.templates.collection,
          )}`;
    case "product":
      return labelOf("product", draft.templates.product);
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
    case "checkout":
      return labelOf("checkout", draft.templates.checkout);
    /* The four whole-page layouts. They shipped after this switch was written
       and were never added to it, so each rendered a BLANK line in the rail —
       which quietly broke the promise in this file's own docstring, that all
       parts collapsed read as an audit of the shop. `shell` is the one worth
       having most: it is the axis that decides what kind of site this is. */
    case "account":
      return labelOf("accountLayout", draft.templates.accountLayout);
    case "cart":
      return labelOf("cartLayout", draft.templates.cartLayout);
    case "content":
      return labelOf("contentLayout", draft.templates.contentLayout);
    case "shell":
      return labelOf("shell", draft.templates.shell);
  }
}
