// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { isComplete } from "@/components/ecommerce/pages/editor/section-instances";
import { SECTION_CATALOGUE } from "@/components/ecommerce/pages/editor/section-catalogue";
import {
  PAGE_TEMPLATES,
  pageTemplate,
  templateSections,
} from "@/components/ecommerce/pages/page-templates";

const PRODUCT = "0000000000000000000000aa";

describe("page templates", () => {
  it("offers the four starting points of plan §9", () => {
    expect(PAGE_TEMPLATES.map((template) => template.id)).toEqual(["single-product", "offer", "launch", "blank"]);
  });

  it("builds every product template into sections that save as they are", () => {
    for (const template of PAGE_TEMPLATES.filter((t) => t.needsProduct)) {
      const sections = templateSections(template, PRODUCT);
      expect(sections.length, template.id).toBeGreaterThan(0);
      for (const section of sections) {
        expect(isComplete(section), `${template.id} → ${section.type}`).toBe(true);
        expect(SECTION_CATALOGUE[section.type as keyof typeof SECTION_SPECS].addable).toBe(true);
        expect(SECTION_SPECS[section.type as keyof typeof SECTION_SPECS].pages).toSatisfy(
          (pages: unknown) => pages === "all" || (Array.isArray(pages) && pages.includes("landing")),
        );
      }
      expect(new Set(sections.map((section) => section.id)).size).toBe(sections.length);
    }
  });

  it("points every product section at the picked product", () => {
    const sections = templateSections(pageTemplate("single-product"), PRODUCT);
    const withProduct = sections.filter((section) => "productId" in section.settings);
    expect(withProduct.map((section) => section.type)).toEqual(["single-product", "order-form", "sticky-order-bar"]);
    expect(withProduct.every((section) => section.settings.productId === PRODUCT)).toBe(true);
  });

  it("keeps each template's own choices", () => {
    const offer = templateSections(pageTemplate("offer"), PRODUCT);
    expect(offer.find((section) => section.type === "order-form")?.settings.coupon).toBe(true);
    expect(offer.find((section) => section.type === "single-product")?.settings.hideDescription).toBe(true);
    const launch = templateSections(pageTemplate("launch"), PRODUCT);
    expect(launch[0].settings.galleryLayout).toBe("gallery-top");
  });

  it("makes nothing without a product, and Blank makes nothing at all", () => {
    expect(templateSections(pageTemplate("offer"))).toEqual([]);
    expect(templateSections(pageTemplate("blank"), PRODUCT)).toEqual([]);
  });
});
