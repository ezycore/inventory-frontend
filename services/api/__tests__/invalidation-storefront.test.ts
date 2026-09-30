// coding-standard: maintained
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateStorefront } = vi.hoisted(() => ({ revalidateStorefront: vi.fn() }));
vi.mock("@/lib/revalidate-storefront", () => ({ revalidateStorefront }));

import { invalidate } from "../invalidation";

/**
 * Which part of the shop's server cache an admin event expires. The keys an event refetches in the
 * admin are covered by `invalidation.test.ts`; this is the second cache, the public storefront's.
 */
describe("invalidate — the storefront's server cache", () => {
  const qc = new QueryClient();
  beforeEach(() => revalidateStorefront.mockClear());

  it("flushes the catalogue for a catalogue edit", async () => {
    await invalidate(qc, "catalog.changed");
    expect(revalidateStorefront).toHaveBeenCalledWith(["catalog"]);
  });

  it("flushes the content scope for a published page", async () => {
    await invalidate(qc, "storefront.page.published");
    expect(revalidateStorefront).toHaveBeenCalledWith(["content"]);
  });

  it("flushes each scope once when several events are composed", async () => {
    await invalidate(qc, "catalog.changed", "storefront.catalog.changed", "storefront.page.published");
    expect(revalidateStorefront).toHaveBeenCalledTimes(1);
    expect(revalidateStorefront).toHaveBeenCalledWith(["catalog", "content"]);
  });

  it("leaves the shop alone for an event it does not render", async () => {
    await invalidate(qc, "role.changed");
    expect(revalidateStorefront).not.toHaveBeenCalled();
  });
});
