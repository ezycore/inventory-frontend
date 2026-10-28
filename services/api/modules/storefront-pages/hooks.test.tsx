// coding-standard: maintained
import { createTestQueryClient, renderHook, TestProviders, waitFor } from "@/tests/test-utils";
import { act, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { storefrontPagesApi } from "./api";
import { useStartHomeFromTheme, useStoreHomePageRow } from "./hooks";

type PageList = Awaited<ReturnType<typeof storefrontPagesApi.list>>;
type PageAnswer = Awaited<ReturnType<typeof storefrontPagesApi.startHomeFromTheme>>;

afterEach(() => vi.restoreAllMocks());

const list = (row: Record<string, unknown>) =>
  ({ data: { items: [{ _id: "home", systemKey: "home", ...row }] } }) as unknown as PageList;

/**
 * Themes → Apply → "start the home page from this theme", then Customize. The
 * home's list row is what Customize previews and publishes by, so it must name
 * the theme's draft from the moment Apply answers — not once the refetch lands.
 */
describe("useStartHomeFromTheme", () => {
  it("writes the home's row from the answer, before the list refetches", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <TestProviders client={client}>{children}</TestProviders>;
    // The first list answers; the refetch Apply sets off never does.
    vi.spyOn(storefrontPagesApi, "list")
      .mockResolvedValueOnce(list({ hasDraft: false, draftTheme: null, draftVersion: 4 }))
      .mockImplementation(() => new Promise(() => {}));
    vi.spyOn(storefrontPagesApi, "startHomeFromTheme").mockResolvedValue({
      data: { _id: "home", draftTheme: "showroom", draftVersion: 5 },
    } as unknown as PageAnswer);

    const { result } = renderHook(() => ({ row: useStoreHomePageRow(), start: useStartHomeFromTheme() }), { wrapper });
    await waitFor(() => expect(result.current.row.home).toBeDefined());
    expect(result.current.row.themeHome).toBeUndefined();

    act(() => result.current.start.mutate("showroom"));

    await waitFor(() => expect(result.current.row.themeHome).toMatchObject({ draftTheme: "showroom", draftVersion: 5 }));
    // Still refetching: the row came from Apply's answer, not the list.
    expect(result.current.row.isFetching).toBe(true);
  });
});

/** The version goes in the body of a publish, and in the query of a discard — a DELETE has no body. */
describe("storefrontPagesApi draft version", () => {
  it("sends the version the caller saw, and nothing without one", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({});
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue({});

    await storefrontPagesApi.publish("p1", 3);
    await storefrontPagesApi.publish("p1");
    await storefrontPagesApi.discardDraft("p1", 3);
    await storefrontPagesApi.discardDraft("p1");

    expect(post.mock.calls).toEqual([
      ["/ecommerce/pages/p1/publish", { draftVersion: 3 }],
      ["/ecommerce/pages/p1/publish", {}],
    ]);
    expect(remove.mock.calls).toEqual([["/ecommerce/pages/p1/draft?draftVersion=3"], ["/ecommerce/pages/p1/draft"]]);
  });
});
