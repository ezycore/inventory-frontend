// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";

/**
 * The sample basket is indistinguishable from a real one — that is what makes it
 * useful, and what makes the notice above it mandatory. Without it a merchant
 * designing their cart page would reasonably read the sample as their own cart,
 * or as their shop having put products in it.
 *
 * The notice must also be absent from an ordinary visit, where `sampleCart` is
 * false: it is editor chrome, and a shopper must never meet it.
 */
let sampleCart = false;

vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({ useStore: () => ({ data: undefined }) }));
vi.mock("@/services/stores/use-sf-preview-store", () => ({ useSfPreview: () => undefined }));
vi.mock("./use-cart-page", () => ({
  useCartPage: () => ({
    t: I18N.en,
    hydrated: true,
    items: [{ productId: "a" }],
    sampleCart,
  }),
}));
vi.mock("./cart-layouts", () => ({
  PanelCart: () => <div>panel</div>,
  CompactCart: () => <div>compact</div>,
  CardsCart: () => <div>cards</div>,
  EditorialCart: () => <div>editorial</div>,
}));

const { CartPageView: View } = await import("./cart-page");

beforeEach(() => {
  sampleCart = false;
});

describe("the sample-cart notice", () => {
  it("is shown over a sample basket", () => {
    sampleCart = true;
    render(<View />);
    expect(screen.getByRole("note")).toHaveTextContent(I18N.en.previewSampleCart);
  });

  it("is absent on a shopper's own cart", () => {
    render(<View />);
    expect(screen.queryByRole("note")).toBeNull();
  });
});
