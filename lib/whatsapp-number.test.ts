// coding-standard: maintained
/**
 * The formats here are the ones real merchants actually save. The
 * `api.whatsapp.com/send/?phone=…` one is what WhatsApp's own "share link"
 * button copies, and it is what broke the Customize panel's layout when it was
 * rendered raw.
 */
import { describe, expect, it } from "vitest";
import { whatsappNumberLabel } from "@/lib/whatsapp-number";

describe("whatsappNumberLabel", () => {
  it("returns a typed phone number untouched", () => {
    expect(whatsappNumberLabel("+8801712345678")).toBe("+8801712345678");
    expect(whatsappNumberLabel("8801712345678")).toBe("8801712345678");
    expect(whatsappNumberLabel("+880 1712-345678")).toBe("+880 1712-345678");
  });

  it("extracts the number from WhatsApp's own share link", () => {
    expect(
      whatsappNumberLabel(
        "https://api.whatsapp.com/send/?phone=8801905886067&text&type=phone_number&app_absent=0",
      ),
    ).toBe("+8801905886067");
  });

  it("extracts the number from a wa.me link, with or without a scheme", () => {
    expect(whatsappNumberLabel("https://wa.me/8801905886067")).toBe("+8801905886067");
    expect(whatsappNumberLabel("wa.me/8801905886067")).toBe("+8801905886067");
    expect(whatsappNumberLabel("https://wa.me/8801905886067?text=hi")).toBe("+8801905886067");
  });

  it("handles blank and missing values", () => {
    expect(whatsappNumberLabel("")).toBe("");
    expect(whatsappNumberLabel("   ")).toBe("");
    expect(whatsappNumberLabel(undefined)).toBe("");
    expect(whatsappNumberLabel(null)).toBe("");
  });

  it("returns an unrecognised value as-is rather than guessing", () => {
    expect(whatsappNumberLabel("https://example.com/contact")).toBe(
      "https://example.com/contact",
    );
  });

  it("never returns a value long enough to break the row it renders in", () => {
    const share =
      "https://api.whatsapp.com/send/?phone=8801905886067&text&type=phone_number&app_absent=0";
    expect(share.length).toBeGreaterThan(60);
    expect(whatsappNumberLabel(share).length).toBeLessThan(20);
  });
});
