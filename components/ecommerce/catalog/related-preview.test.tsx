// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RelatedPreview, relatedReason } from "./related-preview";

const item = (name: string, reason: "picked" | "subcategory" | "tags" | "category" | "store", tagNames?: string[]) => ({
  _id: name,
  name,
  image: null,
  reason,
  ...(tagNames ? { tagNames } : {}),
});

describe("related preview", () => {
  it("names why each product is in the row", () => {
    expect(relatedReason(item("a", "picked"))).toBe("Your pick");
    expect(relatedReason(item("a", "tags", ["Eid Sale", "Red"]))).toBe("Shared tag: Eid Sale, Red");
    expect(relatedReason(item("a", "store"))).toBe("From your store");
  });

  it("dims the products past the default four and says why", () => {
    const items = ["A", "B", "C", "D", "E"].map((n) => item(n, "category"));
    const { container, getByText } = render(<RelatedPreview preview={{ listed: true, items }} />);
    const rows = container.querySelectorAll("li");
    expect(rows).toHaveLength(5);
    expect(rows[3].className).not.toContain("opacity-50");
    expect(rows[4].className).toContain("opacity-50");
    getByText(/shows the first 4/);
  });

  it("explains an unlisted product and an empty row", () => {
    expect(render(<RelatedPreview preview={{ listed: false, items: [] }} />).container.textContent).toContain(
      "isn’t in your store",
    );
    expect(render(<RelatedPreview preview={{ listed: true, items: [] }} />).container.textContent).toContain(
      "No other product matches yet",
    );
  });
});
