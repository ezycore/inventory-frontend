// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  formatCount,
  isLowContrast,
  pickSocialLook,
  readableOn,
  resolveSocialLook,
  soldChipText,
  stockLeftText,
  timeAgoText,
  toastText,
} from "./storefront-social-proof";

const sold = (over: Partial<{ display: "exact" | "rounded"; en: string; bn: string }> = {}) => ({
  display: over.display ?? "exact",
  label: { en: over.en ?? "{count} sold", bn: over.bn ?? "{count}টি বিক্রি হয়েছে" },
  showOnCards: false,
});

describe("sold chip text", () => {
  it("fills the count, grouped, in the shop language's digits", () => {
    expect(soldChipText(1240, sold(), "en")).toBe("1,240 sold");
    expect(soldChipText(1240, sold(), "bn")).toBe("১,২৪০টি বিক্রি হয়েছে");
  });

  it("marks a rounded count with + — the backend floored it", () => {
    expect(soldChipText(120, sold({ display: "rounded" }), "en")).toBe("120+ sold");
  });

  it("never loses the number when a label forgets {count}", () => {
    expect(soldChipText(45, sold({ en: "sold so far" }), "en")).toBe("45 sold so far");
  });

  it("formats counts", () => {
    expect(formatCount(7, "bn")).toBe("৭");
  });
});

describe("stock chip text", () => {
  const stock = (display: "exact" | "vague" = "exact") => ({
    threshold: 5,
    display,
    label: display === "exact" ? { en: "Only {count} left", bn: "মাত্র {count}টি বাকি" } : { en: "Almost gone", bn: "প্রায় শেষ" },
    showOnCards: false,
  });

  it("shows only between 1 and the threshold", () => {
    expect(stockLeftText(stock(), 6, true, "en")).toBeNull();
    expect(stockLeftText(stock(), 5, true, "en")).toBe("Only 5 left");
    expect(stockLeftText(stock(), 1, true, "bn")).toBe("মাত্র ১টি বাকি");
    expect(stockLeftText(stock(), 0, true, "en")).toBeNull();
    expect(stockLeftText(stock(), -2, true, "en")).toBeNull();
  });

  it("never reads an untracked store's sentinel, and is off without the setting", () => {
    expect(stockLeftText(stock(), 3, false, "en")).toBeNull();
    expect(stockLeftText(undefined, 3, true, "en")).toBeNull();
    expect(stockLeftText(stock(), undefined, true, "en")).toBeNull();
  });

  it("vague wording never names the number", () => {
    expect(stockLeftText(stock("vague"), 2, true, "en")).toBe("Almost gone");
  });
});

describe("toast text", () => {
  const entry = { productSlug: "p", name: "Rahim", area: "Mirpur", productName: "Panjabi" };

  it("fills every token", () => {
    expect(toastText(entry, "{name} from {area} bought {product}", "en")).toBe(
      "Rahim from Mirpur bought Panjabi",
    );
    expect(toastText(entry, "{area} থেকে {name} কিনেছেন {product}", "bn")).toBe(
      "Mirpur থেকে Rahim কিনেছেন Panjabi",
    );
  });

  it("drops the place with its joining word when the area is off", () => {
    const noArea = { ...entry, area: undefined };
    expect(toastText(noArea, "{name} from {area} bought {product}", "en")).toBe("Rahim bought Panjabi");
    expect(toastText(noArea, "{area} থেকে {name} কিনেছেন {product}", "bn")).toBe("Rahim কিনেছেন Panjabi");
  });

  it("reads 'Someone' and 'an item' for a hidden name and product", () => {
    expect(toastText({ productSlug: "p" }, "{name} bought {product}", "en")).toBe("Someone bought an item");
  });

  it("prints how long ago in both languages", () => {
    expect(timeAgoText(0, "en")).toBe("just now");
    expect(timeAgoText(12, "en")).toBe("12 min ago");
    expect(timeAgoText(60, "en")).toBe("1 hour ago");
    expect(timeAgoText(60 * 50, "en")).toBe("2 days ago");
    expect(timeAgoText(12, "bn")).toBe("১২ মিনিট আগে");
  });
});

describe("the look", () => {
  it("follows the theme when nothing is set", () => {
    expect(resolveSocialLook(undefined)).toMatchObject({
      chipStyle: "soft",
      chipColor: "accent",
      toastStyle: "light",
      toastRadius: "theme",
      toastBg: null,
    });
  });

  it("falls back on an unknown id or a broken colour, like a saved store", () => {
    const look = resolveSocialLook({ soldChipStyle: "glow", soldChipColor: "#12", toastBg: "red" });
    expect(look.chipStyle).toBe("soft");
    expect(look.chipColor).toBe("accent");
    expect(look.toastBg).toBeNull();
  });

  it("keeps a valid custom colour", () => {
    expect(resolveSocialLook({ soldChipColor: "#7c3aed" }).chipColor).toBe("#7c3aed");
  });

  it("picks only its own keys out of a full templates object", () => {
    expect(pickSocialLook({ productCard: "bold", toastStyle: "dark", toastSize: 3 })).toEqual({
      toastStyle: "dark",
    });
  });
});

describe("contrast", () => {
  it("measures and picks readable text", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(readableOn("#facc15")).toBe("#111111");
    expect(readableOn("#1e3a8a")).toBe("#ffffff");
    expect(isLowContrast("#facc15", "#ffffff")).toBe(true);
    expect(isLowContrast("#111111", "#ffffff")).toBe(false);
  });
});
