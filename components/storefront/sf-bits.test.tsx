// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Media } from "@/components/storefront/sf-bits";

const photo = { url: "/p.webp", mediumUrl: "/p_md.webp", thumbnailUrl: "/p_thumb.webp" };
const VARIANTS = "/p_md.webp 800w, /p.webp 1600w";

describe("Media", () => {
  it("offers the stored variants when given the image, sized by the caller", () => {
    const { container } = render(<Media src={photo} alt="Shirt" sizes="(max-width: 679px) 100vw, 1600px" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("srcset", VARIANTS);
    expect(img).toHaveAttribute("sizes", "(max-width: 679px) 100vw, 1600px");
  });

  it("gives both canvas copies the same variants, so they share one download", () => {
    const { container } = render(<Media src={photo} alt="Shirt" fit="canvas" />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    imgs.forEach((img) => {
      expect(img).toHaveAttribute("srcset", VARIANTS);
      expect(img).toHaveAttribute("sizes", "100vw");
    });
  });

  it("keeps a bare URL a single source", () => {
    const { container } = render(<Media src="/plain.jpg" alt="" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/plain.jpg");
    expect(img).not.toHaveAttribute("srcset");
  });
});
