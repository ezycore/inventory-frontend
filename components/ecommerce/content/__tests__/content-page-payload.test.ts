// coding-standard: maintained
/**
 * The storefront CMS page's wire shape, both directions.
 *
 * The bug these exist for was silent in the worst way: the form rendered
 * "Search title" and "Search description", the backend accepted `seo` and always
 * had, and the two helpers in between carried neither. A merchant typed a search
 * title, saved, reopened the page and found it blank — no error, no warning,
 * nothing on screen suggesting where it went. That is why this is asserted at
 * the payload rather than through the UI.
 */
import { describe, expect, it } from "vitest";
import { cleanContentPage, contentPageToForm } from "../payload";
import type { ContentPage } from "@/services/api";

const page = (over: Partial<ContentPage> = {}): ContentPage =>
  ({
    _id: "p1",
    organizationId: "o1",
    title: "About Us",
    slug: "about",
    body: "",
    published: true,
    showInFooter: true,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }) as ContentPage;

describe("cleanContentPage — form → wire", () => {
  it("carries the SEO pair", () => {
    const body = cleanContentPage({
      title: "About Us",
      slug: "about",
      seo: { title: "About our shop", description: "Who we are." },
    });
    expect(body.seo).toEqual({
      title: "About our shop",
      description: "Who we are.",
    });
  });

  it("nests them, matching the JSON validator", () => {
    // NOT the catalog's flat `seoTitle`/`seoDescription` — that shape exists to
    // survive multipart, and this endpoint is JSON.
    const body = cleanContentPage({ title: "T", slug: "s", seo: { title: "X" } });
    expect(body).not.toHaveProperty("seoTitle");
    expect(body.seo?.title).toBe("X");
  });

  it("trims", () => {
    const body = cleanContentPage({
      title: "T",
      slug: "s",
      seo: { title: "  spaced  ", description: "  also  " },
    });
    expect(body.seo).toEqual({ title: "spaced", description: "also" });
  });

  /**
   * Both keys always go, even empty. `contentPageService.update` `$set`s the
   * whole `seo` subdocument, so an omitted key keeps whatever is stored — and a
   * merchant deleting their override would watch it come back.
   */
  it("sends empty strings so an override can be CLEARED", () => {
    const body = cleanContentPage({ title: "T", slug: "s", seo: {} });
    expect(body.seo).toEqual({ title: "", description: "" });
  });

  it("survives the field being absent entirely", () => {
    const body = cleanContentPage({ title: "T", slug: "s" });
    expect(body.seo).toEqual({ title: "", description: "" });
  });
});

describe("contentPageToForm — stored → edit form", () => {
  it("hydrates the SEO pair", () => {
    const values = contentPageToForm(
      page({ seo: { title: "About our shop", description: "Who we are." } }),
    );
    expect(values.seo).toEqual({
      title: "About our shop",
      description: "Who we are.",
    });
  });

  /**
   * `form.reset()` treats this object as the WHOLE form state, so a missing key
   * is not "left alone" — it blanks the input. Paired with a submit path that
   * always sends both keys, that would make editing the page TITLE wipe the SEO
   * overrides. This is the regression that pairing prevents.
   */
  it("hydrates to empty strings, never undefined, when unset", () => {
    const values = contentPageToForm(page());
    expect(values.seo).toEqual({ title: "", description: "" });
  });

  it("round-trips: load, change nothing, save — SEO survives", () => {
    const stored = page({ seo: { title: "Kept", description: "Also kept" } });
    const body = cleanContentPage(contentPageToForm(stored) as any);
    expect(body.seo).toEqual({ title: "Kept", description: "Also kept" });
  });

  it("round-trips an unrelated edit without touching SEO", () => {
    const stored = page({ seo: { title: "Kept", description: "Also kept" } });
    const values = contentPageToForm(stored);
    const body = cleanContentPage({ ...values, title: "Renamed" } as any);
    expect(body.title).toBe("Renamed");
    expect(body.seo).toEqual({ title: "Kept", description: "Also kept" });
  });
});
