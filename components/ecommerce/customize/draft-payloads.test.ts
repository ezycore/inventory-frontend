import { describe, expect, it } from "vitest";
import {
  publicCollections,
  trimHomeRows,
} from "@/components/ecommerce/customize/draft-payloads";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The collections half of the preview payload.
 *
 * It claims to mirror the public `GET /:slug/categories` contract, and that
 * claim silently stopped being true when categories became a two-level tree: it
 * kept emitting a flat `{_id, name, slug}` list with no `slugPath`, so the
 * storefront — which drops an unlinkable node — rendered an EMPTY header menu in
 * the live preview as soon as the header source was "collections". Nothing
 * failed; the editor just looked broken while the saved shop was fine.
 */
const row = (over: Partial<CustomizeDraft["collections"][number]>) =>
  ({
    _id: "x",
    name: "X",
    slug: "x",
    slugPath: "x",
    parentId: null,
    displayName: "",
    isListed: true,
    ...over,
  }) as CustomizeDraft["collections"][number];

const payload = publicCollections;

describe("publicCollections (the preview's category payload)", () => {
  it("nests children under their parent and carries slugPath", () => {
    const out = payload([
      row({ _id: "lights", name: "Lights", slug: "lights", slugPath: "lights" }),
      row({
        _id: "led",
        name: "Led",
        slug: "led",
        slugPath: "lights/led",
        parentId: "lights",
      }),
    ]);
    expect(out).toEqual([
      {
        _id: "lights",
        name: "Lights",
        slug: "lights",
        slugPath: "lights",
        children: [
          { _id: "led", name: "Led", slug: "led", slugPath: "lights/led" },
        ],
      },
    ]);
  });

  it("drops a node that cannot be linked rather than emitting a dead link", () => {
    // A category predating `slugPath` (healed by `backfill-slugs.ts`).
    expect(payload([row({ _id: "old", slugPath: undefined })])).toEqual([]);
  });

  it("hides an unlisted parent's children with it", () => {
    // They are unreachable by path anyway — the service does the same.
    const out = payload([
      row({ _id: "lights", slugPath: "lights", isListed: false }),
      row({ _id: "led", slugPath: "lights/led", parentId: "lights" }),
    ]);
    expect(out).toEqual([]);
  });

  it("keeps an unlisted child out of a listed parent", () => {
    const out = payload([
      row({ _id: "lights", name: "Lights", slug: "lights", slugPath: "lights" }),
      row({ _id: "led", slugPath: "lights/led", parentId: "lights", isListed: false }),
    ]);
    expect(out[0].children).toEqual([]);
  });

  it("prefers the display name over the category name, at both levels", () => {
    const out = payload([
      row({ _id: "lights", name: "Lights", slugPath: "lights", displayName: " Lighting " }),
      row({
        _id: "led",
        name: "Led",
        slugPath: "lights/led",
        parentId: "lights",
        displayName: "LED strips",
      }),
    ]);
    expect(out[0].name).toBe("Lighting");
    expect(out[0].children[0].name).toBe("LED strips");
  });

  it("preserves the merchant's draft order", () => {
    const out = payload([
      row({ _id: "b", slugPath: "b" }),
      row({ _id: "a", slugPath: "a" }),
    ]);
    expect(out.map((c) => c._id)).toEqual(["b", "a"]);
  });
});

/**
 * The homepage rows on the way out. Both payloads run this, so a rule that
 * differed between them would preview a row the shop would never render.
 */
describe("trimHomeRows (what a homepage row ships as)", () => {
  const skin = row({ _id: "skin", name: "Skin care", slugPath: "care/skin" });
  const owned = [skin];

  it("drops a category row with no collection picked", () => {
    // Half-finished in the panel. The backend validator rejects it, and one
    // unfinished row must not fail the whole page's Save.
    const out = trimHomeRows(
      [
        { id: "a", source: "category" },
        { id: "b", source: "newest" },
      ],
      owned,
    );
    expect(out.map((r) => r.id)).toEqual(["b"]);
  });

  it("drops a row whose collection no longer exists", () => {
    // The trap this closes: the merchant deleted that category months ago and
    // is now editing footer text. The backend's ownership check would 400 the
    // whole Save over a row they are not touching.
    const out = trimHomeRows(
      [
        { id: "gone", source: "category", categoryId: "deleted" },
        { id: "ok", source: "category", categoryId: "skin" },
      ],
      owned,
    );
    expect(out.map((r) => r.id)).toEqual(["ok"]);
  });

  it("clears a stale collection off a re-pointed row", () => {
    const [out] = trimHomeRows(
      [{ id: "a", source: "featured", categoryId: "skin" }],
      owned,
    );
    expect(out.categoryId).toBeUndefined();
  });

  it("sends a blank heading as unset, not as an empty string", () => {
    // "" would print a blank line; undefined means "use the localized wording".
    const [out] = trimHomeRows(
      [{ id: "a", source: "featured", title: "   " }],
      owned,
    );
    expect(out.title).toBeUndefined();
  });

  it("caps the list at the backend's maximum", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i}`,
      source: "featured" as const,
    }));
    expect(trimHomeRows(many, owned)).toHaveLength(6);
  });
});
