import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFilters } from "@/hooks/use-filters";
import type { FilterField } from "@/types/filter";

/**
 * A dependent filter pair: the sub-category options ARE the selected category's
 * children, so switching the parent invalidates whatever child was chosen. Left
 * behind, the stale child is still non-empty and `pickActive` keeps sending it —
 * a pair no product can satisfy, so the list empties for no visible reason.
 */
const fields: FilterField[] = [
  {
    name: "categoryId",
    label: "Category",
    type: "select",
    clearFieldsOnChange: ["subcategoryId"],
  },
  { name: "subcategoryId", label: "Sub-category", type: "select" },
  { name: "brandId", label: "Brand", type: "select" },
];

describe("useFilters clearFieldsOnChange", () => {
  it("drops the dependent filter when its parent changes", () => {
    const { result } = renderHook(() => useFilters(fields));

    act(() => result.current.updateField("categoryId", "skin"));
    act(() => result.current.updateField("subcategoryId", "serums"));
    expect(result.current.values.subcategoryId).toBe("serums");

    act(() => result.current.updateField("categoryId", "hair"));
    expect(result.current.values).toMatchObject({
      categoryId: "hair",
      subcategoryId: "",
    });
  });

  it("leaves unrelated filters alone", () => {
    const { result } = renderHook(() => useFilters(fields));

    act(() => result.current.updateField("brandId", "acme"));
    act(() => result.current.updateField("categoryId", "skin"));
    expect(result.current.values.brandId).toBe("acme");
  });

  it("applies the cleared pair in one shot from an inline control", () => {
    // The inline bar commits live via `setFieldAndApply`, so the clear has to
    // ride along in the SAME onApply — a second render would fire a request for
    // the impossible pair first.
    const onApply = vi.fn();
    const { result } = renderHook(() => useFilters(fields, onApply));

    act(() => result.current.setFieldAndApply("categoryId", "skin"));
    act(() => result.current.setFieldAndApply("subcategoryId", "serums"));
    onApply.mockClear();

    act(() => result.current.setFieldAndApply("categoryId", "hair"));
    expect(onApply).toHaveBeenCalledTimes(1);
    // `pickActive` strips the emptied child rather than sending it blank.
    expect(onApply).toHaveBeenCalledWith({ categoryId: "hair" });
  });
});
