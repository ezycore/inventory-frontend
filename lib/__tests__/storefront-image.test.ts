// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { responsiveImageSources } from "@/lib/storefront-image";

describe("responsiveImageSources", () => {
  it("offers the medium and the original, never the square thumbnail", () => {
    expect(
      responsiveImageSources({ url: "/a.webp", mediumUrl: "/a_md.webp", thumbnailUrl: "/a_thumb.webp" }),
    ).toEqual({ src: "/a.webp", srcSet: "/a_md.webp 800w, /a.webp 1600w" });
  });

  it("adds the large rendition for a wide section picture, keeping the original as src", () => {
    expect(
      responsiveImageSources({
        url: "/h.webp",
        mediumUrl: "/h_md.webp",
        thumbnailUrl: "/h_thumb.webp",
        largeUrl: "/h_lg.webp",
      }),
    ).toEqual({ src: "/h.webp", srcSet: "/h_md.webp 800w, /h.webp 1600w, /h_lg.webp 2560w" });
  });

  it("gives no srcset when there is nothing to choose between", () => {
    // An image imported by URL stores the same URL in all three fields.
    expect(responsiveImageSources({ url: "/x.jpg", mediumUrl: "/x.jpg", thumbnailUrl: "/x.jpg" })).toEqual({
      src: "/x.jpg",
      srcSet: undefined,
    });
    expect(responsiveImageSources({ mediumUrl: "/m.webp" })).toEqual({ src: "/m.webp", srcSet: undefined });
    expect(responsiveImageSources("/plain.jpg")).toEqual({ src: "/plain.jpg", srcSet: undefined });
  });

  it("returns no source for an empty image", () => {
    expect(responsiveImageSources(null)).toEqual({ src: undefined, srcSet: undefined });
    expect(responsiveImageSources("")).toEqual({ src: undefined, srcSet: undefined });
    expect(responsiveImageSources({})).toEqual({ src: undefined, srcSet: undefined });
  });
});
