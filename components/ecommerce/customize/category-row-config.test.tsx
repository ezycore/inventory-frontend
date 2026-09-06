// coding-standard: maintained
/**
 * `CategoryRowConfig` — the card-shape control, and specifically what it writes.
 *
 * The interesting half is not "the merchant pressed split", it is what happens
 * on the way BACK. `stacked` is the fallback `resolveCardShape` applies to a row
 * that has never been asked, so storing the string would put that row outside
 * any future change to what the default means — and on a row holding nothing
 * else, it would leave a saved config entry recording a merchant deciding
 * nothing. Both are invisible in the UI and only observable here.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryRowConfig } from "@/components/ecommerce/customize/category-row-config";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import type { StoreSectionConfig } from "@/lib/storefront-client";

const COLLECTIONS = [
  { _id: "a", name: "Cushion", isListed: true, hasImage: true },
  { _id: "b", name: "Floormat", isListed: true, hasImage: true },
] as unknown as CollectionRowValue[];

const renderPanel = (config?: StoreSectionConfig) => {
  const onChange = vi.fn();
  render(
    <CategoryRowConfig
      config={config}
      collections={COLLECTIONS}
      onChange={onChange}
    />,
  );
  return onChange;
};

const press = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

describe("CategoryRowConfig — card shape", () => {
  it("shows the stacked card as chosen when nothing is saved", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "Photo on top" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Photo beside" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("writes the split shape", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    press("Photo beside");
    expect(onChange).toHaveBeenCalledWith({ cardShape: "split" });
  });

  // Not `{ cardShape: "stacked" }`: the row goes back to having no answer, so
  // it keeps following whatever the default is.
  it("clears the field rather than storing the default", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
    });
    press("Photo on top");
    expect(onChange).toHaveBeenCalledWith({ cardShape: undefined });
  });

  // Same rule the collection picker follows when its last pick is removed.
  it("drops the whole config when the shape was the only thing on the row", () => {
    const onChange = renderPanel({ key: "k", cardShape: "split" });
    press("Photo on top");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("keeps the config when a heading survives the clear", () => {
    const onChange = renderPanel({
      key: "k",
      title: "Shop by room",
      cardShape: "split",
    });
    press("Photo on top");
    expect(onChange).toHaveBeenCalledWith({ cardShape: undefined });
  });

  // The shape is a look, not a pick — a merchant may set it before curating,
  // and the section still renders its fallback collections meanwhile.
  it("can be set on a row with no picks yet", () => {
    const onChange = renderPanel();
    press("Photo beside");
    expect(onChange).toHaveBeenCalledWith({ cardShape: "split" });
  });

  /* The hint follows the CHOICE, because the two shapes now do different things
     on a phone — a thumbnail beside the words, or a full-width picture above
     them. It used to say the phone ignored the setting, which was true and was
     reported as a bug anyway; a hint that names what will change is the only
     kind worth pinning. */
  it("says what a phone does with the stacked card", () => {
    renderPanel();
    expect(screen.getByText(/full width above the words/i)).toBeInTheDocument();
  });

  it("says what a phone does with the split card", () => {
    renderPanel({ key: "k", cardShape: "split" });
    expect(
      screen.getByText(/small square beside the words/i),
    ).toBeInTheDocument();
  });
});
