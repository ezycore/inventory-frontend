// coding-standard: maintained

import { getPreset } from "@/lib/storefront-theme";
import { whatsappNumberLabel } from "@/lib/whatsapp-number";
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
      const saveable = draft.heroSlides.filter((s) => s.title.trim()).length;
      return saveable === 0
        ? "Slides carousel — no slides yet"
        : `Slides carousel · ${count(saveable, "slide")}`;
    }
    case "home": {
      const option = TEMPLATE_OPTIONS.home.find((o) => o.value === draft.templates.home);
      return option ? `${option.label} — ${option.description}` : draft.templates.home;
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
  }
}
