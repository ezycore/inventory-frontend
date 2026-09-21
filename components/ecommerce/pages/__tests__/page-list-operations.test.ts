// coding-standard: maintained
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const list = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({ storefrontPagesApi: { list } }));

import { queryKeys } from "@/services/api/query-keys";
import { pageListOperations } from "@/components/ecommerce/pages/page-list-operations";

/** What `DataTable` actually caches under: the base key plus its paging. */
const tableKey = (base: readonly unknown[]) => [...base, { page: 1, limit: 10 }];

describe("pageListOperations", () => {
  beforeEach(() => list.mockReset());

  it("gives the Landing pages and Store pages tables different cache entries", () => {
    // Both tables once used `storefrontPages.lists()`, so at the same page and
    // size they shared one entry and the Store pages table listed landing pages.
    const landing = tableKey(pageListOperations("landing").queryKey);
    const content = tableKey(pageListOperations("content").queryKey);
    const client = new QueryClient();
    client.setQueryData(landing, "landing rows");
    expect(client.getQueryData(content)).toBeUndefined();
  });

  it("keeps both under the prefix page mutations invalidate", () => {
    const client = new QueryClient();
    const keys = (["landing", "content"] as const).map((kind) =>
      tableKey(pageListOperations(kind).queryKey),
    );
    for (const key of keys) client.setQueryData(key, "rows");
    void client.invalidateQueries({ queryKey: queryKeys.storefrontPages.lists() });
    for (const key of keys) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });

  it("fetches the kind its key names", async () => {
    await pageListOperations("content").getAllData({ page: 2, limit: 20 });
    await pageListOperations("landing").getAllData();
    expect(list).toHaveBeenNthCalledWith(1, { page: 2, limit: 20, kind: "content" });
    expect(list).toHaveBeenNthCalledWith(2, { kind: "landing" });
  });
});
