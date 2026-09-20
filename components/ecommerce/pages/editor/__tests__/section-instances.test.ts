// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS, type SectionType } from "@/lib/storefront-builder/section-specs";
import { SECTION_CATALOGUE } from "../section-catalogue";
import {
  duplicateSection,
  fieldValue,
  hasPhoneValue,
  isComplete,
  moveSection,
  newInstanceId,
  newSection,
  pageContextOf,
  savableSections,
  withFieldValue,
  type EditorSection,
} from "../section-instances";

const ID = /^[A-Za-z0-9_-]{1,40}$/;
const optionalLink: SectionFieldSpec = { type: "url", optional: true };
const requiredText: SectionFieldSpec = { type: "string", max: 120, min: 1 };
const phoneAlign: SectionFieldSpec = { type: "enum", values: ["left", "center"], responsive: true, optional: true };

describe("new sections", () => {
  const addable = (Object.keys(SECTION_SPECS) as SectionType[]).filter((type) => SECTION_CATALOGUE[type].addable);

  it("start complete — they save and draw at once — except those needing a picture, product, link or real review", () => {
    // None of these can be invented, so they start unfinished.
    const unfinished = new Set([
      "image-text", "image-banner", "gallery", "order-form", "single-product", "offer-pricing", "sticky-order-bar", "testimonials", "video",
    ]);
    for (const type of addable) {
      expect(isComplete(newSection(type, [])), type).toBe(!unfinished.has(type));
    }
  });

  it("never offers a section the storefront cannot draw", () => {
    expect(SECTION_CATALOGUE.countdown.addable).toBe(false);
  });

  it("get ids in the backend's grammar, unique across sections and their items", () => {
    const first = newSection("promises-band", []);
    const second = newSection("promises-band", [first]);
    const ids = [first, second].flatMap((section) => [section.id, ...(section.blocks ?? []).map((b) => b.id)]);
    for (const id of ids) expect(id).toMatch(ID);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("picks another id when the first is taken", () => {
    const rolls = [0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const random = () => rolls.shift() ?? 0.9;
    expect(newInstanceId("faq", ["faq-aaaaaa"], random)).not.toBe("faq-aaaaaa");
  });
});

describe("saving", () => {
  it("leaves out an unfinished section and an unfinished item, and keeps the rest", () => {
    const faq = newSection("faq", []);
    const unfinished: EditorSection = {
      ...faq,
      blocks: [...(faq.blocks ?? []), { id: "item-blank", settings: { question: "", answer: "" } }],
    };
    const picture = newSection("image-text", [faq]);
    const saved = savableSections([unfinished, picture]);
    expect(saved.map((section) => section.id)).toEqual([faq.id]);
    expect(saved[0].blocks?.map((block) => block.id)).toEqual(faq.blocks?.map((block) => block.id));
  });
});

describe("a product the page supplies (Phase 6, step 6)", () => {
  const orderForm = (settings: Record<string, unknown> = {}): EditorSection => ({
    id: "order",
    type: "order-form",
    v: 1,
    enabled: true,
    settings,
  });

  it("names every page's context the way the backend validates it", () => {
    expect(pageContextOf({ kind: "system", systemKey: "product" })).toBe("product");
    expect(pageContextOf({ kind: "system" })).toBe("home");
    expect(pageContextOf({ kind: "landing" })).toBe("landing");
    expect(pageContextOf({ kind: "content" })).toBe("content");
  });

  it("is complete with no product on the product page, and saved", () => {
    expect(isComplete(orderForm(), "product")).toBe(true);
    expect(savableSections([orderForm()], "product")).toHaveLength(1);
  });

  it("still needs its product on a landing page", () => {
    expect(isComplete(orderForm(), "landing")).toBe(false);
    expect(savableSections([orderForm()], "landing")).toEqual([]);
    expect(isComplete(orderForm({ productId: "0000000000000000000000aa" }), "landing")).toBe(true);
  });
});

describe("setting a field", () => {
  it("removes an optional field that is cleared, instead of storing it empty", () => {
    const next = withFieldValue({ link: "/products" }, "link", optionalLink, "", "desktop");
    expect(next).not.toHaveProperty("link");
  });

  it("keeps a required field's blank, so the section reads as unfinished", () => {
    expect(withFieldValue({ heading: "Eid" }, "heading", requiredText, "", "desktop")).toEqual({ heading: "" });
  });

  it("sets a phone override on top of the desktop value, and clears back to it", () => {
    const desktop = withFieldValue({}, "align", phoneAlign, "left", "desktop");
    const phone = withFieldValue(desktop, "align", phoneAlign, "center", "mobile");
    expect(phone).toEqual({ align: { base: "left", mobile: "center" } });
    expect(fieldValue(phone, "align", phoneAlign, "mobile")).toBe("center");
    expect(fieldValue(phone, "align", phoneAlign, "desktop")).toBe("left");
    expect(hasPhoneValue(phone, "align", phoneAlign)).toBe(true);

    const cleared = withFieldValue(phone, "align", phoneAlign, undefined, "mobile");
    expect(cleared).toEqual({ align: { base: "left" } });
    expect(fieldValue(cleared, "align", phoneAlign, "mobile")).toBe("left");
  });

  it("keeps the phone override when the desktop value changes", () => {
    const phone = { align: { base: "left", mobile: "center" } };
    expect(withFieldValue(phone, "align", phoneAlign, "center", "desktop")).toEqual({
      align: { base: "center", mobile: "center" },
    });
  });

  /**
   * The phone tab used to write the base when the desktop had none, so choosing
   * Centre while looking at a phone centred the desktop page too — silently, with
   * the note still reading "Same as desktop".
   */
  it("keeps a phone value off the desktop when the desktop has none", () => {
    const phone = withFieldValue({}, "align", phoneAlign, "center", "mobile");
    expect(phone).toEqual({ align: { mobile: "center" } });
    expect(fieldValue(phone, "align", phoneAlign, "desktop")).toBeUndefined();
    expect(fieldValue(phone, "align", phoneAlign, "mobile")).toBe("center");
    expect(hasPhoneValue(phone, "align", phoneAlign)).toBe(true);
  });

  it("drops the whole optional field when its phone-only value is cleared", () => {
    const phone = withFieldValue({}, "align", phoneAlign, "center", "mobile");
    expect(withFieldValue(phone, "align", phoneAlign, undefined, "mobile")).not.toHaveProperty("align");
  });
});

describe("arranging sections", () => {
  const a = newSection("call-to-action", []);
  const b = newSection("faq", [a]);

  it("moves a section and ignores a move past either end", () => {
    expect(moveSection([a, b], b.id, -1).map((s) => s.id)).toEqual([b.id, a.id]);
    expect(moveSection([a, b], a.id, -1).map((s) => s.id)).toEqual([a.id, b.id]);
  });

  it("duplicates right after the original with fresh section and item ids", () => {
    const next = duplicateSection([a, b], b.id);
    expect(next).toHaveLength(3);
    const copy = next[2];
    expect(copy.type).toBe("faq");
    expect(copy.id).not.toBe(b.id);
    expect(copy.blocks?.[0].id).not.toBe(b.blocks?.[0].id);
    expect(copy.blocks?.[0].settings).toEqual(b.blocks?.[0].settings);
  });
});
