// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { shellTheme } from "@/lib/storefront-shell-theme";

describe("shellTheme", () => {
  it("stamps nothing for a store with no colours", () => {
    expect(shellTheme()).toEqual({ style: {}, brand: false, accent: false });
  });

  it("publishes both theme variants of the brand", () => {
    const theme = shellTheme("#1d4ed8");
    expect(theme.brand).toBe(true);
    expect(theme.accent).toBe(false);
    expect(theme.style).toMatchObject({
      "--sf-brand-light": "#1d4ed8",
      "--sf-brand-on-light": expect.any(String),
      "--sf-brand-dark": expect.any(String),
      "--sf-brand-on-dark": expect.any(String),
    });
  });

  it("drops an accent that is the brand colour again", () => {
    const theme = shellTheme("#1D4ED8", "#1d4ed8");
    expect(theme.accent).toBe(false);
    expect(theme.style).not.toHaveProperty("--sf-accent-light");
  });

  it("publishes a real second colour", () => {
    const theme = shellTheme("#1d4ed8", "#f59e0b");
    expect(theme.accent).toBe(true);
    expect(theme.style).toMatchObject({ "--sf-accent-light": "#f59e0b" });
  });
});
