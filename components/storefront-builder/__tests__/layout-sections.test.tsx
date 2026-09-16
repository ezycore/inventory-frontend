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
