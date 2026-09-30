// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionTitle } from "@/components/storefront/sf-bits";

/**
 * `SectionTitle` draws the heading row for the builder's sections and for two
 * views outside a section frame (`product/product-page.tsx`,
 * `product-detail/product-overview.tsx`). Since 2026-09-21 it follows the
 * section's Text alignment, which it could not before: the row is a flex
 * container and `text-align` cannot move a flex item.
 */
describe("SectionTitle", () => {
  it("sets no alignment of its own outside a section frame", () => {
    const { container } = render(<SectionTitle action={<a href="/all">View all</a>}>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;

    expect(row.className).toBe("sfb-title-row");

    // ⚠ **The assertion is the ABSENCE.** A caller outside a section sits in no `.sfb-sec`
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

  it("lets the heading INHERIT its colour, so a section's Text colour reaches it", () => {
    /* Found in a browser: a band with Background = Colour and Text colour = a
       merchant's own painted the band but left the heading `var(--text)`, the
       theme's colour, because the h2 named the token instead of inheriting.
       `.sfb-sec[data-tone]` sets `color` on the FRAME — everything drawn on the
       band has to read it. Outside a builder section, inherit IS `--text`. */
    const { container } = render(<SectionTitle>Our picks</SectionTitle>);
    const heading = container.querySelector("h2") as HTMLElement;
    expect(heading.style.color).toBe("inherit");
  });

  it("draws the heading and its action, in that order", () => {
    const { container } = render(<SectionTitle action={<a href="/all">View all</a>}>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.children).toHaveLength(2);
    expect(row.children[0].tagName).toBe("H2");
    expect(row.children[0].textContent).toBe("Our picks");
    expect(row.children[1].textContent).toBe("View all");
  });

  it("adds no wrapper for a section that was given no line", () => {
    // ⚠ The ABSENCE again. Thirteen sections grew a subheading; callers outside
    // a section pass none, and their markup has to be what it was.
    const { container } = render(<SectionTitle>Our picks</SectionTitle>);
    expect((container.firstElementChild as HTMLElement).className).toBe("sfb-title-row");
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("puts the line under the heading, inside one block", () => {
    const { container } = render(<SectionTitle subheading="Made in Dhaka">Our picks</SectionTitle>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe("");
    expect(wrapper.children[0].className).toBe("sfb-title-row");
    expect(wrapper.children[1].textContent).toBe("Made in Dhaka");
    // The gap moves to the wrapper, so the pair spaces like the heading did.
    expect(wrapper.style.marginBottom).toBe("16px");
    expect((wrapper.children[0] as HTMLElement).style.marginBottom).toBe("6px");
  });

  it("draws the heading alone when there is no action", () => {
    const { container } = render(<SectionTitle>Our picks</SectionTitle>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.children).toHaveLength(1);
    expect(row.children[0].tagName).toBe("H2");
  });
});
