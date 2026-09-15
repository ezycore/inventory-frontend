// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";

describe("sectionCardMedia", () => {
  it("says nothing when the section sets nothing, so cards follow Customize", () => {
    expect(sectionCardMedia({})).toEqual({});
  });

  it("turns the section's own choices into the card's frame and fit", () => {
    expect(sectionCardMedia({ cardImageRatio: "portrait", cardImageFit: "crop" })).toEqual({
      imageRatio: "3 / 4",
      imageFit: "cover",
    });
    expect(sectionCardMedia({ cardImageFit: "fit" })).toEqual({ imageFit: "canvas" });
    expect(sectionCardMedia({ cardImageRatio: "tall" })).toEqual({ imageRatio: "2 / 3" });
  });
});
