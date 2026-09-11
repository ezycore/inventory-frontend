// coding-standard: maintained
/**
 * The banner is the only thing that distinguishes an owner preview from the live
 * shop, and the preview cookie lasts four hours — so a merchant who does not see
 * it concludes their drafts are public.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StorefrontPreviewBanner } from "./preview-banner";
import { PREVIEW_CLEAR_PARAM } from "@/lib/storefront-preview";

describe("StorefrontPreviewBanner", () => {
  it("says drafts are not visible to shoppers", () => {
    const { container } = render(<StorefrontPreviewBanner />);
    expect(container.textContent).toMatch(/preview mode/i);
    expect(container.textContent).toMatch(/shoppers do not see these/i);
  });

  // The proxy reads this param BEFORE the cookie, so the redirecting request is
  // already out of preview. A different param would clear nothing.
  it("offers an exit that the proxy actually recognises", () => {
    const { container } = render(<StorefrontPreviewBanner />);
    const exit = container.querySelector("a");
    expect(exit?.getAttribute("href")).toBe(`?${PREVIEW_CLEAR_PARAM}=1`);
  });
});
