import { describe, expect, it } from "vitest";
import { selectOptions } from "../select-options";

/**
 * A `{{template}}` in an option URL is a contract with the dependent-select
 * renderer: `field-select-inputs.tsx` holds the request back while the URL
 * still `.includes("{{")`, then substitutes via `resolveApiTemplate`.
 *
 * `URLSearchParams.toString()` percent-encodes braces, so a template in a QUERY
 * param arrived as `%7B%7Bvalue%7D%7D`, failed that `includes` test, and was
 * sent to the API verbatim — the product form's Sub-category select rendered
 * "Error: query.parentId: Invalid ObjectId format" and never populated, before
 * OR after a category was picked. Path templates were unaffected, which is why
 * `productVariants` always worked and this went unnoticed.
 */
describe("selectOptions — {{template}} placeholders", () => {
  it("leaves a query-param template unencoded", () => {
    const url = selectOptions("categories", {
      parentId: "{{value}}",
      fields: "_id,name",
    });
    expect(url).toContain("parentId={{value}}");
    expect(url).not.toContain("%7B%7B");
  });

  it("keeps the marker the renderer gates on", () => {
    expect(selectOptions("categories", { parentId: "{{value}}" })).toContain("{{");
  });

  it("leaves a path template alone", () => {
    expect(selectOptions("productVariants")).toContain("{{_id}}");
  });

  it("still encodes ordinary values", () => {
    // Only the brace pair is restored — nothing else about escaping changes.
    const url = selectOptions("categories", { fields: "_id,name" });
    expect(url).toContain("fields=_id%2Cname");
  });

  it("does not invent braces where there were none", () => {
    expect(selectOptions("tags", { status: "active" })).not.toContain("{{");
  });
});
