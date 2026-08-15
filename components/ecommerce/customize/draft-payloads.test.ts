import { describe, expect, it } from "vitest";
import {
  publicCollections,
  toSettingsPayload,
} from "@/components/ecommerce/customize/draft-payloads";
import { DEFAULT_DESIGN } from "@/lib/storefront-theme";
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
 * The save payload rebuilds `theme` as a whole object literal, and the backend
 * applies it with `Object.assign` — "each provided sub-field replaces the
 * existing one". So a theme field the draft does not carry is a theme field the
 * next Save DELETES, silently, from a surface nothing else validates.
 */
const draft = (over: Partial<CustomizeDraft> = {}): CustomizeDraft => ({
  preset: "default",
  brandColor: "#111827",
  accentColor: "#2563eb",
  footerText: "",
  logoStyle: {},
  homeCollections: {},
  design: DEFAULT_DESIGN,
  homepageSections: [],
  sectionConfig: [],
  templates: {},
  badges: [],
  heroSlides: [],
  heroBanner: {},
  navHeader: [],
  announcement: {
    enabled: false,
    text: "",
    link: "",
    bgColor: "#2563eb",
    textColor: "",
    icon: "",
    ctaLabel: "",
    dismissible: false,
    size: "sm",
    bgImage: null,
    overlay: "#000000",
    overlayOpacity: 40,
    bgFit: "cover",
  },
  contactButton: {
    enabled: false,
    label: "",
    greeting: "",
    position: "right",
    showOn: [],
    hoursEnabled: false,
    hoursFrom: "10:00",
    hoursTo: "20:00",
    offlineNote: "",
    nudgeEnabled: false,
    nudgeText: "",
    nudgeDelay: 8,
  },
  footerGroups: [],
  footerContentPages: { show: true, title: "" },
  footerNote: "",
  footerContactHeading: "",
  footerNewsletter: { heading: "", blurb: "", buttonLabel: "" },
  collections: [],
  ...over,
});

describe("toSettingsPayload (theme fields must survive a Save)", () => {
  it("carries the design tokens", () => {
    const design = {
      font: "serif",
      surface: "parchment",
      scale: "lg",
      density: "airy",
      radius: "sharp",
    };
    expect(toSettingsPayload(draft({ design })).theme?.design).toEqual(design);
  });

  // Nothing in the editor writes `appliedThemeId` — a ready-made theme does.
  // Without it in the literal, the first unrelated edit a merchant saved would
  // erase which theme their store is on while the store kept rendering it.
  it("carries appliedThemeId even though no control edits it", () => {
    expect(
      toSettingsPayload(draft({ appliedThemeId: "grocery-modern" })).theme
        ?.appliedThemeId,
    ).toBe("grocery-modern");
  });

  it("leaves appliedThemeId absent for a store that never applied one", () => {
    expect(toSettingsPayload(draft()).theme?.appliedThemeId).toBeUndefined();
  });
});

/**
 * The look/content split (2026-08-12). `theme` is what a ready-made theme
 * replaces wholesale; `copy` is what the merchant wrote. If a word the merchant
 * typed ever appears under `theme` again, applying a theme silently erases it.
 */
describe("toSettingsPayload — theme owns the look, copy owns the words", () => {
  const withCopy = draft({
    footerText: "  Family run since 1998  ",
    footerNote: "Dhaka, Bangladesh",
    footerContactHeading: "Order by phone",
    footerNewsletter: { heading: "Stay in touch", blurb: "", buttonLabel: "" },
  });

  it("sends merchant wording under copy, trimmed", () => {
    expect(toSettingsPayload(withCopy).copy).toEqual({
      footerText: "Family run since 1998",
      footerNote: "Dhaka, Bangladesh",
      footerContactHeading: "Order by phone",
      footerNewsletter: { heading: "Stay in touch", blurb: undefined, buttonLabel: undefined },
    });
  });

  it("keeps every merchant word OUT of theme", () => {
    const theme = toSettingsPayload(withCopy).theme as Record<string, unknown>;
    for (const key of ["footerText", "footerNote", "footerContactHeading", "footerNewsletter"]) {
      expect(theme).not.toHaveProperty(key);
    }
  });

  // Blank ⇒ "use the storefront's localized wording", so it must not ship as "".
  it("omits a blank field rather than sending an empty string", () => {
    expect(toSettingsPayload(draft()).copy).toEqual({
      footerText: undefined,
      footerNote: undefined,
      footerContactHeading: undefined,
      footerNewsletter: undefined,
    });
  });
});
