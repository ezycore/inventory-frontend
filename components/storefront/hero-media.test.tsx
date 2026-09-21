// coding-standard: maintained

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroMedia } from "@/components/storefront/hero-media";

describe("HeroMedia", () => {
  it("preserves the whole image with a responsive soft-fill canvas", () => {
    const { container } = render(
      <HeroMedia
        image={{ mediumUrl: "/hero-800.jpg", url: "/hero-1600.jpg" }}
        fit="canvas"
      />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveClass("sf-hero-media-bg");
    expect(images[1]).toHaveClass("sf-hero-media-fg");
    expect(images[1]).toHaveAttribute(
      "srcset",
      "/hero-800.jpg 800w, /hero-1600.jpg 1600w",
    );
  });

  it("gives the likely LCP photo high priority on both canvas copies", () => {
    const { container } = render(
      <HeroMedia image={{ mediumUrl: "/hero-800.jpg", url: "/hero-1600.jpg" }} fit="canvas" eager />,
    );

    // The blurred copy comes first and shares the URL, so it decides the
    // download's priority — measured `Low` when only the foreground asked.
    for (const img of container.querySelectorAll("img")) {
      expect(img).toHaveAttribute("fetchpriority", "high");
    }
  });

  it("applies the merchant focus point to a cover crop", () => {
    const { container } = render(
      <HeroMedia image="/banner.jpg" fit="cover" focal="72% 24%" />,
    );

    expect(container.firstElementChild).toHaveStyle({
      "--sf-hero-desktop-focus": "72% 24%",
    });
    expect(container.querySelector("img")).toHaveClass("sf-hero-media-cover");
  });

  it("art-directs phones and keeps the desktop source as fallback", () => {
    const { container } = render(
      <HeroMedia
        image={{ mediumUrl: "/desktop-800.jpg", url: "/desktop.jpg" }}
        mobileImage={{ mediumUrl: "/mobile-800.jpg", url: "/mobile.jpg" }}
        fit="cover"
        focal="70% 30%"
        mobileFocal="40% 65%"
      />,
    );

    expect(container.querySelector("source")).toHaveAttribute(
      "srcset",
      "/mobile-800.jpg 800w, /mobile.jpg 1600w",
    );
    expect(container.querySelector("source")).toHaveAttribute(
      "media",
      "(max-width: 640px)",
    );
    expect(container.firstElementChild).toHaveStyle({
      "--sf-hero-desktop-focus": "70% 30%",
      "--sf-hero-mobile-focus": "40% 65%",
    });

    const css = readFileSync(
      resolve(process.cwd(), "app/(storefront)/storefront.css"),
      "utf8",
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*?\.sf-hero-media-cover,[\s\S]*?\.sf-hero-media-bg\s*{[\s\S]*?--sf-hero-mobile-focus,[\s\S]*?--sf-hero-desktop-focus/,
    );
  });
});
