// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionTree } from "../section-tree";
import { newSection, type EditorSection } from "../section-instances";

/**
 * The page's section list. Its row controls moved behind a handle and a ⋯ menu
 * on 2026-10-04, so what is pinned here is that every action the inline buttons
 * offered is still offered — and still withheld from the page's core section.
 */
const faq = newSection("faq", []);
const cta = newSection("call-to-action", [faq]);
const core: EditorSection = { id: "main", type: "product-main", v: 1, enabled: true, settings: {} };

function draw(sections: EditorSection[]) {
  const handlers = {
    onSelect: vi.fn(),
    onMove: vi.fn(),
    onMoveTo: vi.fn(),
    onToggle: vi.fn(),
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    onAdd: vi.fn(),
  };
  render(<SectionTree sections={sections} selectedId={null} {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
}

const menu = (user: ReturnType<typeof userEvent.setup>, label: RegExp) =>
  user.click(screen.getByRole("button", { name: label }));

describe("the section list", () => {
  it("moves a section a step from its menu, and not past either end", async () => {
    const { user, onMove } = draw([faq, cta]);
    await menu(user, /more actions for faq/i);
    expect(screen.getByRole("menuitem", { name: /move up/i })).toHaveAttribute("data-disabled");
    await user.click(screen.getByRole("menuitem", { name: /move down/i }));
    expect(onMove).toHaveBeenCalledWith(faq.id, 1);
  });

  it("moves a section with the arrow keys on its handle", () => {
    const { onMoveTo } = draw([faq, cta]);
    fireEvent.keyDown(screen.getByRole("button", { name: /move call to action/i }), { key: "ArrowUp" });
    expect(onMoveTo).toHaveBeenCalledWith(cta.id, 0);
  });

  it("hides, duplicates and removes a section — removing only after confirming", async () => {
    const { user, onToggle, onDuplicate, onRemove } = draw([faq]);
    await user.click(screen.getByRole("button", { name: /hide section/i }));
    expect(onToggle).toHaveBeenCalledWith(faq.id);

    await menu(user, /more actions for faq/i);
    await user.click(screen.getByRole("menuitem", { name: /duplicate section/i }));
    expect(onDuplicate).toHaveBeenCalledWith(faq.id);

    await menu(user, /more actions for faq/i);
    await user.click(screen.getByRole("menuitem", { name: /remove section/i }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(onRemove).toHaveBeenCalledWith(faq.id);
  });

  it("offers the core section moves only", async () => {
    const { user } = draw([core, faq]);
    // One eye on the page, and it is the FAQ's.
    expect(screen.getAllByRole("button", { name: /hide section/i })).toHaveLength(1);
    await menu(user, /more actions for product/i);
    expect(screen.getByRole("menuitem", { name: /move down/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /duplicate section/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /remove section/i })).toBeNull();
  });

  it("says when a section is hidden or limited to some products", () => {
    draw([
      { ...faq, enabled: false },
      { ...cta, visibility: { products: { tags: ["0000000000000000000000aa"] } } },
    ]);
    expect(screen.getByText("Hidden from shoppers")).toBeInTheDocument();
    expect(screen.getByText("On some products")).toBeInTheDocument();
  });
});
