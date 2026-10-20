// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { resolveSocialLook, type SocialLookRaw } from "@/lib/storefront-social-proof";
import { PurchaseToastView } from "./purchase-toast-view";
import { SoldChipView } from "./sold-chip";

/**
 * Every look control must change what is drawn — a control the renderer never reads is the
 * dead-builder-control trap (a setting the merchant moves and nothing happens).
 */
const chip = (raw: SocialLookRaw) =>
  render(<SoldChipView text="124 sold" look={resolveSocialLook(raw)} />).container.querySelector("[data-sold-chip]")!;
const toast = (raw: SocialLookRaw) =>
  render(
    <PurchaseToastView look={resolveSocialLook(raw)} text="Rahim bought Panjabi" imageUrl="https://img/t.webp" closeLabel="Dismiss" />,
  ).container.querySelector("[data-purchase-toast]")!;

describe("sold chip look", () => {
  it.each<[string, SocialLookRaw, SocialLookRaw]>([
    ["style", { soldChipStyle: "soft" }, { soldChipStyle: "outline" }],
    ["colour", { soldChipColor: "green" }, { soldChipColor: "red" }],
    ["size", { soldChipSize: "sm" }, { soldChipSize: "md" }],
    ["icon", { soldChipIcon: "none" }, { soldChipIcon: "fire" }],
  ])("%s changes the chip", (_, a, b) => {
    expect(chip(a).outerHTML).not.toBe(chip(b).outerHTML);
  });

  it("gives a solid fill readable text", () => {
    const el = chip({ soldChipStyle: "solid", soldChipColor: "#facc15" }) as HTMLElement;
    expect(el.style.color).toBe("rgb(17, 17, 17)");
  });
});

describe("purchase toast look", () => {
  it.each<[string, SocialLookRaw, SocialLookRaw]>([
    ["colours", { toastStyle: "light" }, { toastStyle: "dark" }],
    ["custom background", { toastStyle: "custom", toastBg: "#ffffff" }, { toastStyle: "custom", toastBg: "#000000" }],
    ["custom text", { toastStyle: "custom", toastText: "#111111" }, { toastStyle: "custom", toastText: "#2563eb" }],
    ["size", { toastSize: "normal" }, { toastSize: "compact" }],
    ["corners", { toastRadius: "square" }, { toastRadius: "pill" }],
    ["photo", { toastImage: "square" }, { toastImage: "round" }],
  ])("%s changes the toast", (_, a, b) => {
    expect(toast(a).outerHTML).not.toBe(toast(b).outerHTML);
  });

  it("shapes the placeholder too when the product has no photo", () => {
    const bare = (raw: SocialLookRaw) =>
      render(<PurchaseToastView look={resolveSocialLook(raw)} text="x" closeLabel="Dismiss" />).container.innerHTML;
    expect(bare({ toastImage: "square" })).not.toBe(bare({ toastImage: "round" }));
  });
});
