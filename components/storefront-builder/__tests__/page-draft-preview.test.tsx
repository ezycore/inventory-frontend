// coding-standard: maintained
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
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

describe("requestSignature", () => {
  it("files a query by what it asks for, not by the section it sits in", () => {
    const query = { type: "products", source: "newest", limit: 8, inStock: true } as const;
    expect(requestSignature({ ...query, key: "grid-a" })).toBe(requestSignature({ ...query, key: "grid-b" }));
    expect(requestSignature({ ...query, key: "grid-a" })).not.toBe(
      requestSignature({ ...query, key: "grid-a", limit: 4 }),
    );
  });
});
