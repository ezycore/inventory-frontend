// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { sectionFrame } from "@/lib/storefront-builder/section-style";
import { responsiveVars } from "@/lib/storefront-builder/responsive";

describe("sectionFrame", () => {
  it("lets a frame that owns its width beat the stored one", () => {
    const heroFullBleed = { top: "0px", bottom: "0px", width: "full", ownsAlign: true, ownsWidth: true } as const;

    // The case this exists for: a full-bleed hero whose Style tab still stores
    // "Page column" from before that control was hidden. The layout wins, so
    // the hero is edge to edge and the stale value cannot box it.
    expect(sectionFrame({ width: "content" }, heroFullBleed).width).toBe("full");
    expect(sectionFrame(undefined, heroFullBleed).width).toBe("full");

    // ⚠ The inverted `??`, and why this test exists: `ownsAlign` works by
    // OMITTING a variable, so copying its shape here would compile and change
    // nothing. Without `ownsWidth` the stored value still wins, as it must for
    // every other section.
    const card = { top: "0px", bottom: "0px", width: "full", ownsAlign: true } as const;
    expect(sectionFrame({ width: "content" }, card).width).toBe("content");
  });

  it("applies the defaults when a section has no style", () => {
    const frame = sectionFrame(undefined);
    expect(frame.width).toBe("content");
    expect(frame.tone).toBe("auto");
    expect(frame.style).toEqual({
      "--sfb-pt": "clamp(24px, 4vw, 40px)",
      "--sfb-pb": "clamp(24px, 4vw, 40px)",
    });
  });

  it("emits phone padding and alignment as separate -m properties", () => {
    const frame = sectionFrame({
      padding: { base: { top: "lg", bottom: "none" }, mobile: { top: "sm", bottom: "sm" } },
      align: { base: "left", mobile: "center" },
      width: "full",
      textTone: "light",
    });
    expect(frame.style).toMatchObject({
      "--sfb-pt": "clamp(40px, 6vw, 64px)",
      "--sfb-pb": "0px",
      "--sfb-pt-m": "clamp(12px, 2vw, 20px)",
      "--sfb-pb-m": "clamp(12px, 2vw, 20px)",
      "--sfb-align": "left",
      "--sfb-align-m": "center",
    });
    expect(frame.width).toBe("full");
    expect(frame.tone).toBe("light");
  });

  it("emits no alignment for a section that moves its own text", () => {
    const style = { align: { base: "center", mobile: "left" } };
    // Hiding the Style tab's control is only half of it: without this the frame
    // would keep applying a stored value the merchant can no longer see or clear.
    expect(sectionFrame(style, { top: "0px", bottom: "0px", ownsAlign: true }).style).not.toHaveProperty(
      "--sfb-align",
    );
    expect(sectionFrame(style, { top: "0px", bottom: "0px" }).style).toMatchObject({
      "--sfb-align": "center",
    });
  });

  it("uses a colour or image background only when it is valid", () => {
    expect(sectionFrame({ background: { kind: "color", color: "#1A2B3C" } }).style).toMatchObject({
      "--sfb-bg": "#1A2B3C",
    });
    expect(sectionFrame({ background: { kind: "color", color: "red" } }).style).not.toHaveProperty("--sfb-bg");
    expect(
      sectionFrame({ background: { kind: "image", image: { url: "https://cdn.example/b.webp" } } }).style,
    ).toMatchObject({ "--sfb-bg-image": 'url("https://cdn.example/b.webp")' });
    expect(
      sectionFrame({ background: { kind: "image", image: { url: "javascript:alert(1)" } } }).style,
    ).not.toHaveProperty("--sfb-bg-image");
  });

  it("uses a section type's own frame where the style box sets nothing", () => {
    const home = { top: "22px", bottom: "8px", band: "surface", width: "full" } as const;
    const frame = sectionFrame(undefined, home);
    expect(frame.style).toEqual({ "--sfb-pt": "22px", "--sfb-pb": "8px", "--sfb-bg": "var(--surface)" });
    expect(frame.width).toBe("full");

    const chosen = sectionFrame(
      { padding: { base: { top: "lg", bottom: "sm" } }, background: { kind: "color", color: "#1A2B3C" }, width: "content" },
      home,
    );
    expect(chosen.style).toMatchObject({
      "--sfb-pt": "clamp(40px, 6vw, 64px)",
      "--sfb-pb": "clamp(12px, 2vw, 20px)",
      "--sfb-bg": "#1A2B3C",
    });
    expect(chosen.width).toBe("content");
    expect(sectionFrame({ background: { kind: "none" } }, home).style).toMatchObject({ "--sfb-bg": "transparent" });
  });

  /* X1 — the Style tab's Text alignment did nothing to eight sections' headings,
     because `SectionTitle` is a flex row and `text-align` cannot move a flex
     item. The frame now emits the matching `justify-content` beside it. */
  it("emits a heading justification beside every alignment", () => {
    expect(sectionFrame({ align: { base: "left" } }).style).toMatchObject({
      "--sfb-align": "left",
      "--sfb-title-justify": "flex-start",
    });
    expect(sectionFrame({ align: { base: "center" } }).style).toMatchObject({
      "--sfb-align": "center",
      "--sfb-title-justify": "center",
    });
    expect(sectionFrame({ align: { base: "left", mobile: "center" } }).style).toMatchObject({
      "--sfb-title-justify": "flex-start",
      "--sfb-title-justify-m": "center",
    });
    // A phone-only alignment leaves the desktop's unset, so the stylesheet's own
    // `space-between` keeps drawing the desktop — the same rule the rest of the
    // responsive pairs follow.
    expect(sectionFrame({ align: { mobile: "center" } }).style).toEqual({
      "--sfb-pt": "clamp(24px, 4vw, 40px)",
      "--sfb-pb": "clamp(24px, 4vw, 40px)",
      "--sfb-align-m": "center",
      "--sfb-title-justify-m": "center",
    });
  });

  it("emits no heading justification for a section with no alignment, or one that owns it", () => {
    // ⚠ The ABSENCE is the point, twice over. An unstyled section must emit
    // nothing, so every classic caller of `SectionTitle` and every section
    // nobody has aligned keeps `space-between`; and a section that aligns its
    // own text must not emit a second answer.
    expect(sectionFrame(undefined).style).not.toHaveProperty("--sfb-title-justify");
    expect(sectionFrame({ align: { base: "center" } }, { top: "0px", bottom: "0px", ownsAlign: true }).style)
      .not.toHaveProperty("--sfb-title-justify");
  });

  /* X2 — six sections carry a built-in column that silently beat this control.
     They now keep it only while the merchant has chosen no width. */
  it("reports whether the merchant chose a width, which is not the same as the width", () => {
    // An unset box and an explicit Page column both resolve to "content"; only
    // one of them is the merchant answering.
    expect(sectionFrame(undefined).styledWidth).toBe(false);
    expect(sectionFrame({}).styledWidth).toBe(false);
    expect(sectionFrame({ width: "content" }).styledWidth).toBe(true);
    expect(sectionFrame({ width: "wide" }).styledWidth).toBe(true);
    expect(sectionFrame({ width: "full" }).styledWidth).toBe(true);
    // An invalid stored value is no answer at all, the same way `width` falls back.
    expect(sectionFrame({ width: "huge" }).styledWidth).toBe(false);
    // A section that owns its width has no Width control to obey in the first place.
    expect(sectionFrame({ width: "wide" }, { top: "0px", bottom: "0px", ownsWidth: true }).styledWidth).toBe(false);
  });

  it("falls back to defaults for invalid values", () => {
    const frame = sectionFrame({ width: "huge", textTone: "neon", padding: { base: { top: "xxl" } } });
    expect(frame.width).toBe("content");
    expect(frame.tone).toBe("auto");
    expect(frame.style).toMatchObject({ "--sfb-pt": "clamp(24px, 4vw, 40px)" });
  });
});

describe("responsiveVars", () => {
  it("omits the phone property until an override is set", () => {
    expect(responsiveVars("cols", { base: 4 })).toEqual({ "--cols": "4" });
    expect(responsiveVars("cols", { base: 4, mobile: 2 })).toEqual({ "--cols": "4", "--cols-m": "2" });
    expect(responsiveVars("cols", undefined)).toEqual({});
  });
});
