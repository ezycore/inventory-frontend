// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PageSections,
  prepareSections,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

const section = (id: string, type: string, settings: unknown, style?: unknown): PageSectionInstance => ({
  id,
  type,
  v: 1,
  enabled: true,
  settings,
  style,
});

const renderPage = (instances: PageSectionInstance[]) =>
  render(<PageSections sections={prepareSections(instances)} context={{ base: "/shop" }} data={{}} />);

describe("spacer", () => {
  it("is a band of the merchant's height, with the phone height as its own variable", () => {
    const { container } = renderPage([section("s1", "spacer", { space: { base: 64, mobile: 24 } })]);
    const band = container.querySelector(".sfb-spacer") as HTMLElement;
    expect(band.style.getPropertyValue("--sfb-space")).toBe("64px");
    expect(band.style.getPropertyValue("--sfb-space-m")).toBe("24px");
    expect(band.getAttribute("aria-hidden")).toBe("true");
    expect(band.hasAttribute("data-line")).toBe(false);
  });

  it("draws a line only when asked", () => {
    const { container } = renderPage([section("s1", "spacer", { space: { base: 40 }, line: true })]);
    expect(container.querySelector(".sfb-spacer")?.hasAttribute("data-line")).toBe(true);
  });

  it("adds no padding of its own, but the style box can still add some", () => {
    const [plain] = prepareSections([section("s1", "spacer", { space: { base: 40 } })]);
    expect(plain.frame.style).toMatchObject({ "--sfb-pt": "0px", "--sfb-pb": "0px" });

    const [padded] = prepareSections([
      section("s2", "spacer", { space: { base: 40 } }, { padding: { base: { top: "sm", bottom: "sm" } } }),
    ]);
    expect(padded.frame.style["--sfb-pt" as keyof typeof padded.frame.style]).not.toBe("0px");
  });

  it("is skipped without a height, or with one out of range", () => {
    expect(prepareSections([section("s1", "spacer", {})])).toHaveLength(0);
    expect(prepareSections([section("s1", "spacer", { space: { base: 400 } })])).toHaveLength(0);
  });
});

describe("image-banner", () => {
  const image = { url: "https://cdn.example.com/eid.webp", mediumUrl: "https://cdn.example.com/eid-m.webp", width: 1600, height: 400 };

  it("draws the picture alone, at its own shape, with its description", () => {
    const { container } = renderPage([section("b1", "image-banner", { image, alt: "Eid collection" })]);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe("Eid collection");
    expect(img.getAttribute("width")).toBe("1600");
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector(".sfb-banner-copy")).toBeNull();
    expect(container.querySelector(".sfb-banner-box")?.hasAttribute("data-frame")).toBe(false);
  });

  it("puts the words and a button over it, and is not a link itself", () => {
    const { container } = renderPage([
      section("b1", "image-banner", { image, heading: "Eid sale", text: "Up to 30% off", buttonLabel: "Shop", link: "/eid" }),
    ]);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].className).toBe("sfb-button");
    expect(links[0].getAttribute("href")).toBe("/shop/eid");
    expect(container.querySelector("h2")?.textContent).toBe("Eid sale");
  });

  it("becomes one link with a link and no button label; a label without a link draws no button", () => {
    const linked = renderPage([section("b1", "image-banner", { image, heading: "New in", link: "/new" })]).container;
    const link = linked.querySelector("a.sfb-banner");
    expect(link?.getAttribute("href")).toBe("/shop/new");
    expect(link?.querySelector("h2")?.textContent).toBe("New in");

    const dead = renderPage([section("b2", "image-banner", { image, buttonLabel: "Shop" })]).container;
    expect(dead.querySelector("a")).toBeNull();
    expect(dead.querySelector(".sfb-banner-copy")).toBeNull();
  });

  it("crops to a shape per device around each device's focus point", () => {
    const { container } = renderPage([
      section("b1", "image-banner", {
        image,
        frame: { base: "4:1", mobile: "1:1" },
        focal: { base: { x: 20, y: 30 }, mobile: { x: 70, y: 50 } },
      }),
    ]);
    const banner = container.querySelector(".sfb-banner") as HTMLElement;
    expect(banner.style.getPropertyValue("--sfb-banner-frame")).toBe("4 / 1");
    expect(banner.style.getPropertyValue("--sfb-banner-frame-m")).toBe("1 / 1");
    expect(banner.style.getPropertyValue("--sfb-banner-focal")).toBe("20% 30%");
    expect(banner.style.getPropertyValue("--sfb-banner-focal-m")).toBe("70% 50%");
    expect(container.querySelector(".sfb-banner-box")?.hasAttribute("data-frame")).toBe(true);
    // A cropped banner's box is the shape, not the file's own proportions.
    expect(container.querySelector("img")?.hasAttribute("width")).toBe(false);
  });

  it("is skipped without a picture", () => {
    expect(prepareSections([section("b1", "image-banner", { heading: "Eid" })])).toHaveLength(0);
  });
});
