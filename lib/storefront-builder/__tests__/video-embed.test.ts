// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { parseVideoEmbed, videoPlayerUrl, videoPosterUrl } from "@/lib/storefront-builder/video-embed";

const ID = "dQw4w9WgXcQ";

describe("parseVideoEmbed", () => {
  it("reads every common YouTube link shape", () => {
    for (const link of [
      `https://www.youtube.com/watch?v=${ID}&t=30`,
      `https://youtu.be/${ID}?si=abc`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/embed/${ID}`,
    ]) {
      expect(parseVideoEmbed(link), link).toEqual({ provider: "youtube", id: ID });
    }
  });

  it("reads Facebook video, watch, reel and fb.watch links", () => {
    expect(parseVideoEmbed("https://www.facebook.com/shop/videos/123456/")).toEqual({
      provider: "facebook",
      href: "https://www.facebook.com/shop/videos/123456/",
    });
    expect(parseVideoEmbed("https://m.facebook.com/watch/?v=987&ref=share")).toEqual({
      provider: "facebook",
      href: "https://www.facebook.com/watch/?v=987",
    });
    expect(parseVideoEmbed("https://www.facebook.com/reel/555")?.provider).toBe("facebook");
    expect(parseVideoEmbed("https://fb.watch/abcDEF/")).toEqual({ provider: "facebook", href: "https://fb.watch/abcDEF/" });
  });

  it("embeds nothing from any other link", () => {
    for (const link of [
      undefined,
      "",
      "not a link",
      "https://vimeo.com/123",
      "https://www.youtube.com/channel/abc",
      "https://www.youtube.com/watch?v=short",
      "https://www.facebook.com/shop/posts/1",
      "https://evil.example/www.youtube.com/watch?v=dQw4w9WgXcQ",
      "javascript:alert(1)",
    ]) {
      expect(parseVideoEmbed(link), String(link)).toBeNull();
    }
  });

  it("builds the player and cover addresses", () => {
    const yt = { provider: "youtube", id: ID } as const;
    expect(videoPlayerUrl(yt)).toBe(`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0`);
    expect(videoPosterUrl(yt)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
    const fb = { provider: "facebook", href: "https://fb.watch/x/" } as const;
    expect(videoPlayerUrl(fb)).toContain("href=https%3A%2F%2Ffb.watch%2Fx%2F");
    expect(videoPosterUrl(fb)).toBeUndefined();
  });
});
