// coding-standard: maintained
/**
 * `SectionsEditor` — what happens on a shop that has never composed its own
 * homepage, which is 14 of the 43 live storefronts.
 *
 * Those shops store NO `homepageSections`; the storefront falls back to the
 * home template's preset and the editor shows that same preset so the merchant
 * edits the page they can actually see. The trap is that the preset is not in
 * the draft — so any edit has to write BOTH halves, or one of them is thrown
 * away with no error:
 *
 * - `toSettingsPayload` drops every `sectionConfig` entry whose key is not in
 *   `homepageSections`, so configuring a row while the list is still empty was
 *   silently discarded at Save.
 * - A preset entry may now carry config of its own ("a grid, sourced newest"),
 *   which is lost the moment the list is written without it.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SectionsEditor } from "@/components/ecommerce/customize/sections-editor";
import { HOME_PRESET_SECTIONS } from "@/lib/storefront-section-ids";
import { sectionInstances } from "@/lib/storefront-templates";

const renderEditor = (props?: { config?: Parameters<typeof SectionsEditor>[0]["config"] }) => {
  const onChange = vi.fn();
  const onConfigChange = vi.fn();
  render(
    <SectionsEditor
      sections={[]}
      config={props?.config ?? []}
      collections={[]}
      homeTemplate="classic"
      onChange={onChange}
      onConfigChange={onConfigChange}
    />,
  );
  return { onChange, onConfigChange };
};

const classic = sectionInstances(HOME_PRESET_SECTIONS.classic);

describe("SectionsEditor on a shop still running the preset", () => {
  it("shows the preset's sections rather than an empty box", () => {
    renderEditor();
    // One row per preset entry, named by its section. ("Featured products" also
    // appears as a source OPTION, so the list itself is what is counted.)
    expect(screen.getAllByRole("listitem")).toHaveLength(classic.sections.length);
    expect(screen.getByText("Hero card")).toBeInTheDocument();
  });

  // The shipped bug: config without a list is an orphan the payload deletes.
  it("writes the section list when the merchant configures a row", () => {
    const { onChange, onConfigChange } = renderEditor();
    const row = screen.getAllByRole("combobox")[0];
    fireEvent.change(row, { target: { value: "newest" } });

    expect(onConfigChange).toHaveBeenCalledTimes(1);
    const [config] = onConfigChange.mock.calls[0];
    // The merchant's edit, PLUS the config Classic itself implies — its second
    // grid is sourced newest, and materializing one half without the other is
    // how that row would quietly become a duplicate Featured row.
    expect(config).toEqual(
      expect.arrayContaining([
        ...classic.config,
        expect.objectContaining({ key: "featured-grid-2", source: "newest" }),
      ]),
    );

    // …and the list that gives that config a section to belong to.
    expect(onChange).toHaveBeenCalledWith(classic.sections);
    for (const entry of config) {
      expect(classic.sections.some((s) => s.key === entry.key)).toBe(true);
    }
  });

  it("writes the section list when the merchant reorders", () => {
    const { onChange } = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /Move Hero card down/i }));

    const [next] = onChange.mock.calls[0];
    const swapped = [...classic.sections];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(next).toEqual(swapped);
  });

  // Removing a section and dropping its config happen in ONE commit, so
  // neither write can undo the other.
  it("removes a section and its config together", () => {
    const own = [{ key: "featured-grid-2", source: "featured" as const }];
    const { onChange, onConfigChange } = renderEditor({ config: own });
    // Named by its SOURCE, which is the only thing separating two product grids
    // on the same page — "Product grid" alone would match both.
    fireEvent.click(screen.getByRole("button", { name: /Remove Featured products/i }));

    const [sections] = onChange.mock.calls[0];
    expect(sections.some((s: { key: string }) => s.key === "featured-grid-2")).toBe(false);
    const [config] = onConfigChange.mock.calls[0];
    expect(config.some((c: { key: string }) => c.key === "featured-grid-2")).toBe(false);
  });
});
