// coding-standard: maintained
/**
 * The bug this locks down: a social link saved without a scheme rendered as a **relative** href, so
 * the storefront's Facebook button navigated shoppers to a 404 on the merchant's own shop. It was
 * live and invisible — nothing type-checks an `<a href>`, and the only evidence was
 * `GET /facebook.com/rkrashu 404` in a dev server log.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { hrefFor, SocialLinks } from "./social-links";

describe("hrefFor", () => {
  it("makes a schemeless URL absolute instead of relative", () => {
    // The regression: without a scheme the browser resolves against the shop's origin.
    expect(hrefFor("facebook", "facebook.com/rkrashu")).toBe(
      "https://facebook.com/rkrashu",
    );
    expect(hrefFor("instagram", "www.instagram.com/rkrashu")).toBe(
      "https://www.instagram.com/rkrashu",
    );
  });

  it("leaves an already-absolute URL untouched", () => {
    expect(hrefFor("facebook", "https://facebook.com/rkrashu")).toBe(
      "https://facebook.com/rkrashu",
    );
    // http is the owner's choice; upgrading it silently would break links that
    // genuinely have no TLS.
    expect(hrefFor("facebook", "http://facebook.com/rkrashu")).toBe(
      "http://facebook.com/rkrashu",
    );
  });

  it("normalizes supported profile handles to their public destinations", () => {
    expect(hrefFor("youtube", "@ezycore")).toBe("https://youtube.com/@ezycore");
    expect(hrefFor("threads", "ezycore")).toBe("https://threads.net/@ezycore");
    expect(hrefFor("linkedin", "company/ezycore")).toBe(
      "https://linkedin.com/company/ezycore",
    );
  });

  it("only picks the scheme for a protocol-relative URL", () => {
    expect(hrefFor("instagram", "//instagram.com/rkrashu")).toBe(
      "https://instagram.com/rkrashu",
    );
  });

  it("turns a bare WhatsApp phone number into a wa.me link", () => {
    expect(hrefFor("whatsapp", "+880 1712-345678")).toBe(
      "https://wa.me/8801712345678",
    );
    expect(hrefFor("whatsapp", "01712345678")).toBe("https://wa.me/01712345678");
  });

  it("treats a WhatsApp link as a URL, not a phone number", () => {
    // Digit-stripping a URL used to mangle the path — `wa.me/8801712345678`
    // survived only because the letters happened to be droppable.
    expect(hrefFor("whatsapp", "wa.me/8801712345678")).toBe(
      "https://wa.me/8801712345678",
    );
    expect(hrefFor("whatsapp", "https://wa.me/8801712345678")).toBe(
      "https://wa.me/8801712345678",
    );
    expect(hrefFor("whatsapp", "chat.whatsapp.com/AbC123")).toBe(
      "https://chat.whatsapp.com/AbC123",
    );
  });
});

describe("SocialLinks", () => {
  it("renders every configured profile safely and omits empty channels", () => {
    const html = renderToStaticMarkup(
      createElement(SocialLinks, {
        social: {
          profiles: [
            { platform: "youtube", url: "https://youtube.com/@ezycore" },
            { platform: "threads", url: "@ezycore" },
            { platform: "tiktok", url: "" },
            { platform: "x", url: "ezycore" },
            { platform: "linkedin", url: "company/ezycore" },
            { platform: "mastodon", url: "https://example.social/@ezycore" },
          ],
        },
      }),
    );
    expect(html).toContain('aria-label="YouTube"');
    expect(html).toContain('aria-label="Threads"');
    expect(html).toContain('aria-label="X / Twitter"');
    expect(html).toContain('aria-label="LinkedIn"');
    expect(html).not.toContain('aria-label="TikTok"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
