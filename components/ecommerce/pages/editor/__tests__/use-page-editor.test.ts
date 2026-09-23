// coding-standard: maintained
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StorefrontPage } from "@/services/api";
import { newSection, type EditorSection } from "../section-instances";
import { usePageEditor } from "../use-page-editor";

/**
 * What the editor opens on, and what it does not reopen.
 *
 * A page holding one section opens on that section's settings — every system
 * page and every new store page starts that way, and the list would be a single
 * row whose only use is to be clicked. The rule is read once, when the editor
 * opens, so going back or deleting down to one section leaves the list up.
 */
const pageWith = (sections: EditorSection[]): StorefrontPage =>
  ({ _id: "page-1", kind: "content", draft: { sections }, published: null }) as unknown as StorefrontPage;

const cta = newSection("call-to-action", []);
const faq = newSection("faq", [cta]);

describe("usePageEditor", () => {
  it("opens on the only section when the page holds one", () => {
    const { result } = renderHook(() => usePageEditor(pageWith([cta])));

    expect(result.current.selectedId).toBe(cta.id);
    expect(result.current.selected?.id).toBe(cta.id);
  });

  it("opens on the section list when the page holds more than one", () => {
    const { result } = renderHook(() => usePageEditor(pageWith([cta, faq])));

    expect(result.current.selectedId).toBeNull();
  });

  it("opens on the empty list when the page holds nothing", () => {
    const { result } = renderHook(() => usePageEditor(pageWith([])));

    expect(result.current.selectedId).toBeNull();
  });

  it("stays on the list once the merchant goes back from the only section", () => {
    const { result, rerender } = renderHook(() => usePageEditor(pageWith([cta])));

    act(() => result.current.select(null));
    rerender();

    expect(result.current.selectedId).toBeNull();
  });

  it("does not open a section when deleting leaves one behind", () => {
    const { result } = renderHook(() => usePageEditor(pageWith([cta, faq])));

    act(() => result.current.remove(faq.id));

    expect(result.current.sections).toHaveLength(1);
    expect(result.current.selectedId).toBeNull();
  });

  it("opens the section it just added", () => {
    const { result } = renderHook(() => usePageEditor(pageWith([cta, faq])));

    act(() => result.current.add("faq"));

    expect(result.current.sections).toHaveLength(3);
    expect(result.current.selectedId).not.toBeNull();
    expect(result.current.selectedId).not.toBe(cta.id);
    expect(result.current.selectedId).not.toBe(faq.id);
  });
});
