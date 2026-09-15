// coding-standard: maintained
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontPage } from "@/services/api";
import { newSection, type EditorSection } from "../section-instances";

const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({
  useSaveStorefrontPageDraft: () => ({ mutateAsync, isPending: false }),
}));

import { AUTOSAVE_DELAY_MS, usePageAutosave } from "../use-page-autosave";

/**
 * Autosave's promises: it waits for a pause, pins each save to the version it
 * last saw, and when the draft moved on elsewhere it stops instead of guessing.
 */
const page = { _id: "page-1", draftVersion: 3, draft: null, published: null } as unknown as StorefrontPage;

const renderAutosave = () =>
  renderHook(({ sections }) => usePageAutosave(page, sections), {
    initialProps: { sections: [] as EditorSection[] },
  });

const pause = () => act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS + 50));

describe("usePageAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mutateAsync.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves after a pause, pinned to the version it last saw, then to the one the save returned", async () => {
    mutateAsync.mockResolvedValueOnce({ data: { draftVersion: 4 } }).mockResolvedValueOnce({ data: { draftVersion: 5 } });
    const cta = newSection("call-to-action", []);
    const { result, rerender } = renderAutosave();

    rerender({ sections: [cta] });
    expect(result.current.dirty).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();

    await pause();
    expect(mutateAsync).toHaveBeenCalledWith({ id: "page-1", body: { sections: [cta], draftVersion: 3 } });
    expect(result.current.dirty).toBe(false);

    const faq = newSection("faq", [cta]);
    rerender({ sections: [cta, faq] });
    await pause();
    expect(mutateAsync).toHaveBeenLastCalledWith({
      id: "page-1",
      body: { sections: [cta, faq], draftVersion: 4 },
    });
  });

  it("stops and asks for a reload when the draft was saved somewhere else", async () => {
    mutateAsync.mockRejectedValue({ status: 409, code: "STOREFRONT_PAGE_DRAFT_CONFLICT", message: "stale" });
    const cta = newSection("call-to-action", []);
    const { result, rerender } = renderAutosave();

    rerender({ sections: [cta] });
    await pause();
    expect(result.current.problem?.kind).toBe("conflict");

    rerender({ sections: [cta, newSection("faq", [cta])] });
    await pause();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("does not retry content the backend refused until it changes", async () => {
    mutateAsync.mockRejectedValue({ status: 400, code: "SECTION_INVALID", message: "Invalid page sections" });
    const cta = newSection("call-to-action", []);
    const { result, rerender } = renderAutosave();

    rerender({ sections: [cta] });
    await pause();
    await pause();
    expect(result.current.problem).toEqual({ kind: "invalid", message: "Invalid page sections" });
    expect(mutateAsync).toHaveBeenCalledTimes(1);

    rerender({ sections: [cta, newSection("faq", [cta])] });
    await pause();
    expect(mutateAsync).toHaveBeenCalledTimes(2);
  });
});
