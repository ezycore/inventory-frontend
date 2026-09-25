// coding-standard: maintained
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { PAGE_SECTION_SELECT } from "@/lib/storefront-builder/page-draft-messages";
import {
  PAGE_DRAFT_APPLIED,
  PAGE_DRAFT_MESSAGE,
  PAGE_DRAFT_READY,
  PageDraftPreview,
  requestSignature,
} from "@/components/storefront-builder/page-draft-preview";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({ name }: { name: string }) => <div data-island={name} />,
}));

/**
 * The editor's preview frame redraws a builder page from sections the parent
 * posts, before they are saved. What must hold: only the frame's own parent can
 * redraw it, only in the editor's frame (`?preview=1`), and a product query is
 * recognised by what it asks for, not by the section it sits in.
 */
const cta = (heading: string) => ({
  id: "cta",
  type: "call-to-action",
  v: 1,
  enabled: true,
  settings: { heading, buttonLabel: "Shop now", buttonHref: "/products" },
});

const renderPreview = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PageDraftPreview slug="rafi5" instances={[cta("Eid offer")]} data={{}} context={{ base: "/shop" }} />
    </QueryClientProvider>,
  );

const post = (data: unknown, source: MessageEventSource | null = window.parent) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, source }));
  });

describe("PageDraftPreview", () => {
  let posted: unknown[];

  beforeEach(() => {
    posted = [];
    vi.spyOn(window.parent, "postMessage").mockImplementation((message: unknown) => {
      posted.push(message);
    });
    window.history.replaceState(null, "", "/shop/pages/eid?preview=1");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("draws the saved sections, then the ones the editor sends, and says so", () => {
    renderPreview();
    expect(screen.getByText("Eid offer")).toBeInTheDocument();
    expect(posted).toContainEqual({ type: PAGE_DRAFT_READY });

    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [cta("Eid offer — 25% off")] } });

    expect(screen.getByText("Eid offer — 25% off")).toBeInTheDocument();
    expect(posted).toContainEqual({ type: PAGE_DRAFT_APPLIED });
  });

  it("ignores sections from anything but its own parent frame", () => {
    renderPreview();
    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [cta("Injected")] } }, null);
    expect(screen.queryByText("Injected")).not.toBeInTheDocument();
    expect(screen.getByText("Eid offer")).toBeInTheDocument();
  });

  it("does not listen outside the editor's frame", () => {
    window.history.replaceState(null, "", "/shop/pages/eid");
    renderPreview();
    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [cta("Changed")] } });
    expect(screen.queryByText("Changed")).not.toBeInTheDocument();
    expect(posted).not.toContainEqual({ type: PAGE_DRAFT_READY });
  });

  it("redraws a product page's add-on with the page's own product, and not without the page", () => {
    // Offer & pricing names no product on the product page (`fromPage`); read
    // without the page it is missing a required product and drops out.
    window.history.replaceState(null, "", "/shop/products/nakshi-kantha?preview=1&builder=1");
    const offer = { id: "offer", type: "offer-pricing", v: 1, enabled: true, settings: { heading: "Eid price" } };
    const context = {
      base: "/shop",
      currency: "BDT",
      product: { _id: "0000000000000000000000bb", name: "Nakshi kantha", slug: "nakshi-kantha" } as CatalogProduct,
    };
    const draw = (pageContext?: "product") =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <PageDraftPreview slug="rafi5" instances={[]} data={{}} context={context} pageContext={pageContext} />
        </QueryClientProvider>,
      );

    const onPage = draw("product");
    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [offer] } });
    expect(screen.getByText("Eid price")).toBeInTheDocument();
    onPage.unmount();

    draw();
    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [offer] } });
    expect(screen.queryByText("Eid price")).not.toBeInTheDocument();
  });
});

/**
 * The click capture, which is a `document`-level capture-phase listener that
 * calls `stopPropagation` — so what it swallows never reaches React at all.
 *
 * That is right for the shop's own links and buttons (a click while editing must
 * pick the section, not add a product to the merchant's basket or navigate the
 * frame away) and wrong for the sample cart, whose stepper and remove button are
 * the thing the merchant is looking at. Browser QA found the sample's controls
 * inert for exactly this reason; the exemption is `[data-preview-interactive]`,
 * which only a sample draws.
 *
 * Driven through a plain DOM node rather than a section view: the unit under
 * test is the listener, and the cart view needs a store, a shopper context and a
 * catalogue to render at all.
 */
describe("PageDraftPreview — clicks inside a section", () => {
  let posted: unknown[];
  let host: HTMLElement;

  const click = (el: Element) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  beforeEach(() => {
    posted = [];
    vi.spyOn(window.parent, "postMessage").mockImplementation((message: unknown) => {
      posted.push(message);
    });
    window.history.replaceState(null, "", "/shop/cart?preview=1&builder=1");
    renderPreview();
    host = document.createElement("div");
    host.setAttribute("data-section-id", "cart-lines");
    host.innerHTML =
      '<button id="shop">Add to cart</button>' +
      '<div data-preview-interactive=""><button id="sample">+</button></div>';
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("swallows a shop control's click and picks the section instead", () => {
    const delivered = click(host.querySelector("#shop") as Element);
    expect(delivered).toBe(false);
    expect(posted).toContainEqual({
      type: PAGE_SECTION_SELECT,
      payload: { id: "cart-lines" },
    });
  });

  it("lets a sample cart's own control through, and does not select on it", () => {
    const delivered = click(host.querySelector("#sample") as Element);
    expect(delivered).toBe(true);
    expect(posted).not.toContainEqual({
      type: PAGE_SECTION_SELECT,
      payload: { id: "cart-lines" },
    });
  });

  /** The exemption is for controls, not for getting out of the page being edited. */
  it("still swallows a link inside the sample", () => {
    host.querySelector("[data-preview-interactive]")!.innerHTML = '<a id="away" href="/products">Browse</a>';
    expect(click(host.querySelector("#away") as Element)).toBe(false);
  });
});

/**
 * The header and footer are the layout's, not sections, so the section capture
 * never saw them: the logo navigated the page editor's frame off the page being
 * edited and onto an address it was not previewing ("not found"). They are
 * turned off only once the PAGE editor has posted — the Customize frame is a
 * preview session too, and browsing the shop is what that frame is for.
 */
describe("PageDraftPreview — the chrome around the sections", () => {
  let chrome: HTMLElement;

  const click = (el: Element) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  const submit = (el: Element) =>
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  beforeEach(() => {
    vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    window.history.replaceState(null, "", "/shop/products?preview=1&builder=1");
    renderPreview();
    chrome = document.createElement("header");
    chrome.innerHTML =
      '<a id="logo" href="/"><img alt="" /></a>' +
      '<button id="menu">Menu</button>' +
      '<form id="search"><input name="q" /></form>' +
      '<div data-preview-interactive=""><form id="sample"></form></div>';
    document.body.appendChild(chrome);
  });

  afterEach(() => {
    chrome.remove();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  const driveFromPageEditor = () =>
    post({ type: PAGE_DRAFT_MESSAGE, payload: { sections: [cta("Eid offer")] } });

  it("leaves the chrome's links live until the page editor drives the frame", () => {
    expect(click(chrome.querySelector("#logo") as Element)).toBe(true);
    expect(submit(chrome.querySelector("#search") as Element)).toBe(true);
    expect(document.documentElement.hasAttribute("data-page-editor")).toBe(false);
  });

  it("stops the logo and the search box from navigating once it does", () => {
    driveFromPageEditor();
    expect(click(chrome.querySelector("#logo img") as Element)).toBe(false);
    expect(submit(chrome.querySelector("#search") as Element)).toBe(false);
    expect(document.documentElement.hasAttribute("data-page-editor")).toBe(true);
  });

  it("leaves the chrome's buttons and the sample basket's forms alone", () => {
    driveFromPageEditor();
    expect(click(chrome.querySelector("#menu") as Element)).toBe(true);
    expect(submit(chrome.querySelector("#sample") as Element)).toBe(true);
  });

  it("is not armed by the Customize editor's own messages", () => {
    post({ type: "ezycore-preview", payload: {} });
    expect(click(chrome.querySelector("#logo") as Element)).toBe(true);
  });
});

describe("requestSignature", () => {
  it("files a query by what it asks for, not by the section it sits in", () => {
    const query = { type: "products", source: "newest", limit: 8, inStock: true } as const;
    expect(requestSignature({ ...query, key: "grid-a" })).toBe(requestSignature({ ...query, key: "grid-b" }));
    expect(requestSignature({ ...query, key: "grid-a" })).not.toBe(
      requestSignature({ ...query, key: "grid-a", limit: 4 }),
    );
  });
});
