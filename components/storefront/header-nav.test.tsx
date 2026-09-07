// coding-standard: maintained
/**
 * The header menu's HOVER SEAM.
 *
 * `topLink` / `dropLink` were `CSSProperties` objects applied inline, which set
 * `color` on the element itself — and an inline declaration outranks every rule
 * in `storefront.css`, so the merchant's hover effect could never have taken
 * hold no matter how the stylesheet was written. The fix was to move both into
 * classes; what is pinned here is that they STAY there, because the failure is
 * silent: the header keeps looking exactly right and only the effect the
 * merchant chose is missing.
 *
 * jsdom computes no cascade, so this asserts the contract rather than the
 * pixels — the class the stylesheet selects is present, and no inline colour
 * sits in front of it.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderNav } from "@/components/storefront/header-nav";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";

const CATEGORIES: CatalogCategory[] = [
  { _id: "a", name: "Skin care", slug: "skin-care", slugPath: "skin-care" },
];

const MENU: StoreMenuItem[] = [
  {
    label: "Shop",
    type: "category",
    value: "skin-care",
    children: [{ label: "Serums", type: "category", value: "skin-care" }],
  },
  { label: "Blog", type: "url", value: "https://example.com/blog" },
];

const renderNav = () =>
  render(<HeaderNav base="" menu={MENU} categories={CATEGORIES} />);

describe("HeaderNav — what the stylesheet can reach", () => {
  it("gives every top-level item the class the hover rules select", () => {
    renderNav();
    // Both kinds: a category link and a merchant-typed URL, which render
    // through different branches of `NavLink` (`Link` vs a raw `<a>`) and would
    // be easy to fix in one and miss in the other.
    expect(screen.getByText("Shop").closest("a")).toHaveClass("sf-nav-top");
    expect(screen.getByText("Blog").closest("a")).toHaveClass("sf-nav-top");
  });

  it("gives a dropdown item its own class, answered separately", () => {
    renderNav();
    // The dropdown is hover-mounted, so open it the way a shopper does — the
    // handler sits on the item's wrapper, not on the link.
    const top = screen.getByText("Shop").closest("a") as HTMLElement;
    fireEvent.mouseEnter(top.parentElement as HTMLElement);
    const child = screen.getByText("Serums").closest("a");
    expect(child).toHaveClass("sf-nav-child");
    expect(child).not.toHaveClass("sf-nav-top");
  });

  it("puts no inline colour in front of the merchant's hover choice", () => {
    renderNav();
    // The whole bug: `color` set inline beats every rule in the stylesheet, so
    // `:hover { color: var(--primary) }` would silently do nothing.
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("style") ?? "").not.toContain("color");
    }
  });
});
