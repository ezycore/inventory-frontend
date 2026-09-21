// coding-standard: maintained
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SfImage } from "@/components/storefront/sf-image";

const photo = { url: "/p.webp", mediumUrl: "/p_md.webp", thumbnailUrl: "/p_thumb.webp" };

describe("SfImage", () => {
  afterEach(() => {
    document.head.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  });

  it("is lazy by default and sizes its srcset", () => {
    const { container } = render(<SfImage image={photo} alt="Cushion" sizes="(max-width: 679px) 50vw, 25vw" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/p.webp");
    expect(img).toHaveAttribute("srcset", "/p_md.webp 800w, /p.webp 1600w");
    expect(img).toHaveAttribute("sizes", "(max-width: 679px) 50vw, 25vw");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("alt", "Cushion");
    expect(img).not.toHaveAttribute("fetchpriority");
  });

  it("drops sizes when there is no srcset to size", () => {
    const { container } = render(<SfImage image="/plain.jpg" alt="" sizes="100vw" />);
    expect(container.querySelector("img")).not.toHaveAttribute("sizes");
  });

  it("loads a priority image at once, with high priority and a preload hint", () => {
    const { container } = render(<SfImage image={photo} alt="Hero" sizes="100vw" priority />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
    const hint = document.head.querySelector('link[rel="preload"][as="image"]');
    expect(hint).toHaveAttribute("imagesrcset", "/p_md.webp 800w, /p.webp 1600w");
    expect(hint).toHaveAttribute("imagesizes", "100vw");
  });

  it("art-directs phones through <picture> at the storefront breakpoint", () => {
    const { container } = render(
      <SfImage image={photo} mobileImage={{ url: "/m.webp", mediumUrl: "/m_md.webp" }} alt="" sizes="100vw" />,
    );
    const source = container.querySelector("picture > source")!;
    expect(source).toHaveAttribute("media", "(max-width: 679px)");
    expect(source).toHaveAttribute("srcset", "/m_md.webp 800w, /m.webp 1600w");
  });

  it("hides a decorative copy and renders nothing without a source", () => {
    const { container } = render(<SfImage image={photo} alt="Ignored" sizes="100vw" decorative />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");

    const empty = render(<SfImage image={null} alt="" sizes="100vw" />);
    expect(empty.container.firstChild).toBeNull();
  });
});
