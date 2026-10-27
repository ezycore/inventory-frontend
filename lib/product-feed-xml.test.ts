import { describe, expect, it } from "vitest";
import type { ProductFeed } from "@/types/api";
import { escapeXml, productFeedXml } from "./product-feed-xml";

const feed = (items: ProductFeed["items"]): ProductFeed => ({
  enabled: true,
  storeName: "Urii & Baba",
  currency: "BDT",
  items,
});

const opts = {
  homeUrl: "https://uriibaba.com/",
  productUrl: (slug: string) => `https://uriibaba.com/products/${slug}`,
};

describe("productFeedXml", () => {
  it("writes a Google product RSS item with sale price, extra images and spaced availability", () => {
    const xml = productFeedXml(
      feed([
        {
          id: "p1",
          title: "Velvet <Cover>",
          description: "Soft & warm",
          slug: "velvet-cover",
          images: ["https://cdn.x/a.webp", "https://cdn.x/b.webp"],
          price: 600,
          salePrice: 450,
          availability: "out_of_stock",
          brand: "Urii",
          category: "Home > Cushions",
        },
      ]),
      opts,
    );
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<title>Urii &amp; Baba</title>");
    expect(xml).toContain("<g:title>Velvet &lt;Cover&gt;</g:title>");
    expect(xml).toContain("<g:description>Soft &amp; warm</g:description>");
    expect(xml).toContain("<g:link>https://uriibaba.com/products/velvet-cover</g:link>");
    expect(xml).toContain("<g:image_link>https://cdn.x/a.webp</g:image_link>");
    expect(xml).toContain("<g:additional_image_link>https://cdn.x/b.webp</g:additional_image_link>");
    expect(xml).toContain("<g:price>600.00 BDT</g:price>");
    expect(xml).toContain("<g:sale_price>450.00 BDT</g:sale_price>");
    expect(xml).toContain("<g:availability>out of stock</g:availability>");
    expect(xml).toContain("<g:product_type>Home &gt; Cushions</g:product_type>");
    expect(xml).toContain("<g:condition>new</g:condition>");
  });

  it("groups variants, falls back to the store as brand, and omits an absent sale price", () => {
    const xml = productFeedXml(
      feed([
        {
          id: "v1",
          groupId: "p9",
          title: "Shirt - S",
          description: "Shirt",
          slug: "shirt",
          images: ["https://cdn.x/s.webp"],
          price: 300,
          availability: "in_stock",
        },
      ]),
      opts,
    );
    expect(xml).toContain("<g:item_group_id>p9</g:item_group_id>");
    expect(xml).toContain("<g:brand>Urii &amp; Baba</g:brand>");
    expect(xml).toContain("<g:availability>in stock</g:availability>");
    expect(xml).not.toContain("sale_price");
    expect(xml).not.toContain("product_type");
  });

  it("drops characters XML cannot carry at all", () => {
    expect(escapeXml("a\u0001b\u000Bc'\"")).toBe("abc&apos;&quot;");
  });
});
