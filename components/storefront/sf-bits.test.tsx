// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionTitle } from "@/components/storefront/sf-bits";

/**
 * `SectionTitle` draws the heading row on both storefronts — the builder's
 * sections and the four CLASSIC callers (`home/sections/product-sections.tsx`,
 * `home/sections/category-banners.tsx`, `product/product-page.tsx`,
 * `product-detail/product-overview.tsx`). Since 2026-09-21 it follows the
 * section's Text alignment, which it could not before: the row is a flex
 * container and `text-align` cannot move a flex item.
 */
describe("SectionTitle", () => {
  it("sets no alignment of its own, so a classic page renders as it always did", () => {
    const { container } = render(<SectionTitle action={<a href="/all">View all</a>}>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;

    expect(row.className).toBe("sfb-title-row");

    // ⚠ **The assertion is the ABSENCE.** A classic caller sits in no `.sfb-sec`
    // and so sets no `--sfb-title-justify`; the stylesheet's own `space-between`
    // then decides, which is byte for byte what the inline style used to say.
    // Asserting that the row merely "renders" would pass whatever this does —
    // the trap that let a hero regression reach production on 2026-09-21.
    expect(row.style.justifyContent).toBe("");
    expect(row.getAttribute("style") ?? "").not.toContain("--sfb-title-justify");

    // The rest of the row is unchanged, and stays inline.
    expect(row.style.display).toBe("flex");
    expect(row.style.alignItems).toBe("center");
    expect(row.style.marginBottom).toBe("16px");
  });

  it("draws the heading and its action, in that order", () => {
    const { container } = render(<SectionTitle action={<a href="/all">View all</a>}>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.children).toHaveLength(2);
    expect(row.children[0].tagName).toBe("H2");
    expect(row.children[0].textContent).toBe("Our picks");
    expect(row.children[1].textContent).toBe("View all");
  });

  it("draws the heading alone when there is no action", () => {
    const { container } = render(<SectionTitle>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.children).toHaveLength(1);
    expect(row.children[0].tagName).toBe("H2");
  });
});
