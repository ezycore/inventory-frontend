// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoreAnnouncement } from "@/lib/storefront-client";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";

/* The bar reads the preview store only to decide whether a dismissed message
   stays hidden, which is not what these tests are about. */
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useSfPreview: (select: (s: Record<string, unknown>) => unknown) =>
    select({ active: false }),
}));

const NOTICE =
  "Our Dhanmondi branch is closed for renovation until 12 March; orders ship from Uttara as usual.";

const renderBar = (extra?: Partial<StoreAnnouncement>) =>
  render(
    <AnnouncementBar
      slug="rmc"
      base="/shop"
      announcement={{ enabled: true, text: NOTICE, ...extra }}
    />,
  );

/**
 * The scrolling announcement.
 *
 * Asserted through the DOM rather than the animation: jsdom runs no CSS, so
 * what is worth pinning is the STRUCTURE the stylesheet needs — a clipped
 * viewport, a track, and exactly two copies of the message — plus the parts
 * that are this component's own responsibility rather than the stylesheet's.
 */
describe("announcement bar scrolling", () => {
  it("stays on one static copy when scrolling is off", () => {
    const { container } = renderBar();
    expect(container.querySelector(".sf-marquee")).toBeNull();
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
  });

  /* Two copies and no more: the loop travels exactly half the track, so a third
     would put the seam in the wrong place and the message would jump. */
  it("renders the seam as a second copy when scrolling is on", () => {
    const { container } = renderBar({ marquee: true });
    expect(container.querySelector(".sf-marquee")).not.toBeNull();
    expect(container.querySelectorAll(".sf-marquee-item")).toHaveLength(2);
    expect(screen.getAllByText(NOTICE)).toHaveLength(2);
  });

  /**
   * The duplicate is decoration, and it has to be inert as well as hidden.
   *
   * `aria-hidden` alone is the trap: the copy can carry the merchant's CTA
   * link, and a focusable control inside an aria-hidden subtree is a tab stop
   * a screen reader cannot announce — the shopper tabs onto a button that says
   * nothing at all.
   */
  it("keeps the duplicate out of the accessibility tree and the tab order", () => {
    const { container } = renderBar({
      marquee: true,
      link: "/products",
      ctaLabel: "Shop now",
    });
    const [, clone] = container.querySelectorAll(".sf-marquee-item");

    expect(clone).toHaveAttribute("aria-hidden", "true");
    expect(clone).toHaveAttribute("inert");
    // One announced copy of the message and one reachable CTA, not two.
    expect(screen.getAllByRole("link", { name: "Shop now" })).toHaveLength(1);
  });

  /* The pace is published as a custom property the stylesheet animates, so the
     duration is decided once on the server — see `marqueeDurationSeconds`. */
  it("publishes a duration that follows the chosen pace", () => {
    const durationOf = (speed: StoreAnnouncement["marqueeSpeed"]) => {
      const { container } = renderBar({ marquee: true, marqueeSpeed: speed });
      const el = container.querySelector<HTMLElement>(".sf-marquee");
      return Number(el?.style.getPropertyValue("--sf-marquee-dur").replace("s", ""));
    };

    expect(durationOf("slow")).toBeGreaterThan(durationOf("fast"));
    expect(durationOf("normal")).toBeGreaterThan(0);
  });

  it("still lets the shopper dismiss a scrolling bar", () => {
    renderBar({ marquee: true, dismissible: true });
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
