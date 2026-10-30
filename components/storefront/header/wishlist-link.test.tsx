import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WishlistLink, type HeaderCtx } from "@/components/storefront/header/header-shared";

/** Only the fields `WishlistLink` reads. */
const ctxFor = (showWishlist: boolean): HeaderCtx =>
  ({ base: "/shop", showWishlist, t: { tabWishlist: "Wishlist" } }) as HeaderCtx;

/**
 * The Showroom header's heart answers its own switch (Customize → Header →
 * Computer → Wishlist), which `store-header.tsx` folds together with customer
 * accounts — the wishlist lives in the account.
 */
describe("WishlistLink", () => {
  it("links to the account's wishlist while it is on", () => {
    const { container } = render(<WishlistLink ctx={ctxFor(true)} />);
    expect(container.querySelector("a")).toHaveAttribute("href", "/shop/account?tab=wishlist");
  });

  it("draws nothing once it is switched off", () => {
    const { container } = render(<WishlistLink ctx={ctxFor(false)} />);
    expect(container.innerHTML).toBe("");
  });
});
