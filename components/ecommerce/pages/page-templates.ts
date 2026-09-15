// coding-standard: maintained
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import { newSection, type EditorSection } from "@/components/ecommerce/pages/editor/section-instances";

/**
 * The starting points offered by "New landing page" (backend plan
 * storefront-builder §9): Single product COD, Offer / campaign, Product launch,
 * Blank.
 *
 * A template is only a list of sections — each made by `newSection`, so it
 * starts from the same defaults as a section added in the editor — with the
 * picked product filled in. Nothing about the product is copied: the product
 * sections draw its photos, price and description live, so the page stays right
 * when the product changes. Section wording is English, like the editor
 * (owner decision, plan §17).
 */

export type PageTemplateId = "single-product" | "offer" | "launch" | "blank";

export interface PageTemplate {
  id: PageTemplateId;
  label: string;
  description: string;
  /** False only for Blank: every other template is built around one product. */
  needsProduct: boolean;
  /** What each section starts with, beyond its defaults. `productId` is added to every product section. */
  sections: readonly { type: SectionType; settings?: Record<string, unknown> }[];
}

/** Section types that point at the page's product. */
const PRODUCT_SECTIONS: ReadonlySet<SectionType> = new Set([
  "single-product",
  "offer-pricing",
  "order-form",
  "sticky-order-bar",
]);

export const PAGE_TEMPLATES: readonly PageTemplate[] = [
  {
    id: "single-product",
    label: "Single product, cash on delivery",
    description: "The product, your promises, how to order, an order form and common questions.",
    needsProduct: true,
    sections: [
      { type: "single-product" },
      { type: "promises-band" },
      { type: "how-to-order" },
      { type: "order-form" },
      { type: "faq" },
      { type: "sticky-order-bar" },
    ],
  },
  {
    id: "offer",
    label: "Offer or campaign",
    description: "The price and discount first, then an order form with a coupon box.",
    needsProduct: true,
    sections: [
      { type: "offer-pricing" },
      { type: "single-product", settings: { hideDescription: true } },
      { type: "promises-band" },
      { type: "order-form", settings: { coupon: true } },
      { type: "sticky-order-bar" },
    ],
  },
  {
    id: "launch",
    label: "Product launch",
    description: "Large photos, room to tell shoppers what is new, and its benefits.",
    needsProduct: true,
    sections: [
      { type: "single-product", settings: { galleryLayout: "gallery-top" } },
      { type: "rich-text" },
      { type: "benefits" },
      { type: "promises-band" },
      { type: "faq" },
      { type: "order-form" },
      { type: "sticky-order-bar" },
    ],
  },
  {
    id: "blank",
    label: "Blank",
    description: "An empty page. Add sections yourself.",
    needsProduct: false,
    sections: [],
  },
];

export const pageTemplate = (id: PageTemplateId): PageTemplate =>
  PAGE_TEMPLATES.find((template) => template.id === id) ?? PAGE_TEMPLATES[PAGE_TEMPLATES.length - 1];

/**
 * The sections a new page starts with. A product template without a product
 * returns nothing rather than sections that cannot be saved.
 */
export function templateSections(template: PageTemplate, productId?: string): EditorSection[] {
  if (template.needsProduct && !productId) return [];
  const sections: EditorSection[] = [];
  for (const { type, settings } of template.sections) {
    const section = newSection(type, sections);
    section.settings = {
      ...section.settings,
      ...settings,
      ...(PRODUCT_SECTIONS.has(type) ? { productId } : {}),
    };
    sections.push(section);
  }
  return sections;
}
