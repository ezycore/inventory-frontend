// coding-standard: maintained
/**
 * The gallery's two quiet failure modes. The hover-zoom origin math can be wrong
 * without looking wrong in a screenshot: an unclamped origin pans past the image
 * edge and shows page background inside the frame, and only on the few
 * pointermove events that report a coordinate outside the box. And the hero —
 * the product page's LCP image — can lose its `srcset`, which looks identical
 * and sends every phone the 1600px original.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductGallery, zoomOrigin } from "./product-gallery";

vi.mock("@/services/storefront/ui-context", () => ({ useStorefrontUI: () => ({ t: { zoomHint: "Zoom" } }) }));
vi.mock("@/services/storefront/use-image-fit", () => ({ useStoreImageFit: () => "canvas" }));
vi.mock("@/services/storefront/use-image-ratio", () => ({ useStoreImageRatio: () => "1 / 1" }));

const RECT = { left: 100, top: 50, width: 400, height: 400 };

describe("zoomOrigin", () => {
  it("maps the pointer to its percentage position inside the hero", () => {
    expect(zoomOrigin(RECT, 300, 250)).toBe("50.00% 50.00%");
    expect(zoomOrigin(RECT, 100, 50)).toBe("0.00% 0.00%");
    expect(zoomOrigin(RECT, 500, 450)).toBe("100.00% 100.00%");
    expect(zoomOrigin(RECT, 200, 150)).toBe("25.00% 25.00%");
  });

  it("clamps a coordinate reported outside the box", () => {
    expect(zoomOrigin(RECT, 40, 20)).toBe("0.00% 0.00%");
    expect(zoomOrigin(RECT, 620, 700)).toBe("100.00% 100.00%");
  });

  it("centers rather than dividing by zero on an unmeasured box", () => {
    expect(zoomOrigin({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toBe("50% 50%");
  });
});

describe("ProductGallery hero", () => {
  const heroImages = (images: { url?: string; mediumUrl?: string; thumbnailUrl?: string }[]) =>
    render(<ProductGallery images={images} alt="Polo" layout="side" index={0} onSelect={() => {}} />)
      .container.querySelectorAll(".sf-pdp-zoom img");

  it("lets a phone take the medium variant and a wide screen the original", () => {
    const imgs = heroImages([{ url: "/polo.webp", mediumUrl: "/polo_md.webp", thumbnailUrl: "/polo_thumb.webp" }]);
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((img) => {
      expect(img).toHaveAttribute("srcset", "/polo_md.webp 800w, /polo.webp 1600w");
      expect(img).toHaveAttribute("sizes", "(max-width: 679px) 100vw, 1600px");
    });
  });

  it("keeps an image imported by URL a single source", () => {
    const same = "https://example.test/polo.jpg";
    const imgs = heroImages([{ url: same, mediumUrl: same, thumbnailUrl: same }]);
    imgs.forEach((img) => {
      expect(img).toHaveAttribute("src", same);
      expect(img).not.toHaveAttribute("srcset");
    });
  });
});
