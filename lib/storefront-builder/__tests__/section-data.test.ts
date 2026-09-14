// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  MAX_SECTION_DATA_PARAM_LENGTH,
  MAX_SECTION_DATA_REQUESTS,
  chunkSectionDataRequests,
  productSectionRequest,
  type ProductsDataRequest,
} from "@/lib/storefront-builder/section-data";

const ID = (n: number) => n.toString(16).padStart(24, "0");

describe("productSectionRequest", () => {
  it("asks catalogue-wide sources for in-stock products only", () => {
    expect(productSectionRequest("g1", { source: "featured", limit: 8 })).toEqual({
      key: "g1",
      type: "products",
      source: "featured",
      limit: 8,
      inStock: true,
    });
  });

  it("keeps every hand-picked product, sold out or not", () => {
    expect(productSectionRequest("g1", { source: "manual", limit: 4, productIds: [ID(1), ID(2)] })).toEqual({
      key: "g1",
      type: "products",
      source: "manual",
      limit: 4,
      productIds: [ID(1), ID(2)],
    });
  });

  it("returns null when the source has nothing to point at", () => {
    expect(productSectionRequest("g1", { source: "category", limit: 8 })).toBeNull();
    expect(productSectionRequest("g1", { source: "tag", limit: 8, tagIds: [] as string[] })).toBeNull();
    expect(productSectionRequest("g1", { source: "manual", limit: 8 })).toBeNull();
  });
});

describe("chunkSectionDataRequests", () => {
  const featured = (key: string): ProductsDataRequest => ({ key, type: "products", source: "featured", limit: 8 });
  const manual = (key: string): ProductsDataRequest => ({
    key,
    type: "products",
    source: "manual",
    limit: 24,
    productIds: Array.from({ length: 24 }, (_, i) => ID(i + 1)),
  });

  it("keeps a normal page in one call", () => {
    expect(chunkSectionDataRequests([featured("a"), featured("b")])).toHaveLength(1);
    expect(chunkSectionDataRequests([])).toEqual([]);
  });

  it("splits at the request count cap", () => {
    const requests = Array.from({ length: MAX_SECTION_DATA_REQUESTS + 1 }, (_, i) => featured(`k${i}`));
    const chunks = chunkSectionDataRequests(requests);
    expect(chunks.map((chunk) => chunk.length)).toEqual([MAX_SECTION_DATA_REQUESTS, 1]);
  });

  it("splits before the encoded query passes the backend's length cap, keeping order", () => {
    const requests = Array.from({ length: 10 }, (_, i) => manual(`m${i}`));
    const chunks = chunkSectionDataRequests(requests);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(JSON.stringify(chunk).length).toBeLessThanOrEqual(MAX_SECTION_DATA_PARAM_LENGTH);
    }
    expect(chunks.flat().map((request) => request.key)).toEqual(requests.map((request) => request.key));
  });
});
