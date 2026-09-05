// coding-standard: maintained
/**
 * The "Publish to store" fields are flat on the form and nested on the wire.
 *
 * `storefrontObjectSchema` on the backend parses `storefront` as a JSON object,
 * so the three fields have to be collected into one before submit. Get this
 * wrong and nothing breaks loudly: the product saves, the validator ignores the
 * unrecognised top-level keys, and the merchant gets a listing with none of the
 * things they typed — no error, no warning, and no reason to look.
 *
 * That silence is why this is tested at the payload rather than through the UI.
 */
import { describe, it, expect, vi } from "vitest";
import { makePrepareSubmitData } from "../helpers";

const t = ((key: string) => key) as never;
const prepare = makePrepareSubmitData(t);

const readStorefront = (fd: FormData) => {
  const raw = fd.get("storefront");
  return typeof raw === "string" ? JSON.parse(raw) : undefined;
};

describe("publish-to-store payload", () => {
  it("nests the listing fields under `storefront`", () => {
    const fd = prepare(
      {
        name: "Panjabi",
        price: 900,
        isListed: true,
        onlinePrice: 850,
        onlineDescription: "Cotton, full sleeve",
      },
      false,
    );

    expect(readStorefront(fd)).toEqual({
      isListed: true,
      onlinePrice: 850,
      onlineDescription: "Cotton, full sleeve",
    });
  });

  it("does not also send them as top-level keys", () => {
    // A duplicate flat key is ignored by the validator at best and shadows the
    // object at worst — either way it is a second source of truth for the same
    // value, which is exactly how the two drift.
    const fd = prepare(
      { name: "Panjabi", price: 900, isListed: true, onlinePrice: 850 },
      false,
    );
    expect(fd.get("isListed")).toBeNull();
    expect(fd.get("onlinePrice")).toBeNull();
  });

  it("sends no `storefront` at all when the section was stripped", () => {
    // Every tier except storefront-without-stock has these fields removed by
    // `useFilteredFormConfig`. An empty `{}` here would still be a write, and
    // would blank a stocked merchant's listing settings on every product save.
    const fd = prepare({ name: "Panjabi", price: 900 }, false);
    expect(fd.get("storefront")).toBeNull();
  });

  it("omits an emptied optional rather than sending a blank", () => {
    // Online price left empty means "sell at the base price", which the backend
    // expresses as the field being absent. Sending `""` would fail the number
    // coercion and reject the whole save.
    const fd = prepare(
      { name: "Panjabi", price: 900, isListed: true, onlinePrice: "", onlineDescription: "" },
      false,
    );
    expect(readStorefront(fd)).toEqual({ isListed: true });
  });

  it("keeps `isListed: false` — a deliberate unlist is not an empty value", () => {
    // The one falsy value that must survive. Filtering on truthiness instead of
    // on null/undefined/"" would drop it, and a merchant who unticked the box
    // would find the product live anyway.
    const fd = prepare(
      { name: "Panjabi", price: 900, isListed: false },
      false,
    );
    expect(readStorefront(fd)).toEqual({ isListed: false });
  });
});
