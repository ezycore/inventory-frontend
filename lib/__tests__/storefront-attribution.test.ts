// coding-standard: maintained
import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureVisitSource, orderSource, utmFromSearch } from "../storefront-attribution";
import { spyOnStorage } from "@/tests/storage-spy";

/**
 * A visit's source is last-touch per half: the tags follow the latest ad click,
 * the page follows the latest landing page, and the pages in between change
 * neither — the shopper who opens a product after the landing page still orders
 * "from" that landing page.
 */
const visit = (path: string, pageId?: string) => {
  window.history.replaceState({}, "", path);
  captureVisitSource(pageId);
};

describe("storefront attribution", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("reads the utm tags without their prefix, trimmed and capped", () => {
    expect(utmFromSearch(`?utm_source=facebook&utm_campaign=%20eid%20&utm_term=${"x".repeat(300)}&ref=a`)).toEqual({
      source: "facebook",
      campaign: "eid",
      term: "x".repeat(200),
    });
    expect(utmFromSearch("?ref=a&utm_medium=")).toBeUndefined();
  });

  it("keeps the landing page and the ad through the pages that follow", () => {
    visit("/pages/eid-offer?utm_source=facebook&utm_campaign=eid", "page-1");
    visit("/products/panjabi");

    expect(orderSource()).toEqual({ pageId: "page-1", utm: { source: "facebook", campaign: "eid" } });
  });

  it("lets a later ad click and a later landing page replace their own half", () => {
    visit("/pages/eid-offer?utm_campaign=eid", "page-1");
    visit("/?utm_campaign=puja");
    expect(orderSource()).toEqual({ pageId: "page-1", utm: { campaign: "puja" } });

    visit("/pages/puja-offer", "page-2");
    expect(orderSource()).toEqual({ pageId: "page-2", utm: { campaign: "puja" } });
  });

  it("has nothing to send for a visit with no page and no tags", () => {
    visit("/products/panjabi");
    expect(orderSource()).toBeUndefined();
  });

  it("ignores the merchant's own Customize preview", () => {
    visit("/pages/eid-offer?preview=1&utm_campaign=eid", "page-1");
    // Not "storage is empty": entering preview writes its own sticky flag
    // (`isPreviewSession`). What must not be written is a visit source.
    expect(window.sessionStorage.getItem("ezy-visit-source")).toBeNull();
    expect(orderSource()).toBeUndefined();
  });

  it("keeps ignoring the merchant after the click that drops `?preview=1`", () => {
    // Every storefront link is a bare path, so the merchant's first click
    // inside the preview frame lands on a param-less URL. Read off the URL
    // alone, that turned them back into a shopper and their own browsing was
    // attributed as a visit.
    visit("/pages/eid-offer?preview=1", "page-1");
    visit("/products/panjabi?utm_campaign=eid");

    expect(orderSource()).toBeUndefined();
  });

  it("never throws when storage refuses", () => {
    // `spyOnStorage`, not `vi.spyOn(Storage.prototype, …)` — see that helper:
    // the prototype spy patched a class nothing uses, so this case simulated no
    // failure at all and had been passing for the wrong reason.
    spyOnStorage(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => visit("/pages/eid-offer?utm_campaign=eid", "page-1")).not.toThrow();
    expect(orderSource()).toBeUndefined();
  });
});
