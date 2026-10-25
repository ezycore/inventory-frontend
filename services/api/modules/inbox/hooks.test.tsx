// coding-standard: maintained
import { createTestQueryClient, renderHook, TestProviders, waitFor } from "@/tests/test-utils";
import { act, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "../../query-keys";
import { inboxApi } from "./api";
import { useConnectInboxOAuthPage, useInboxConnection } from "./hooks";

type Connection = Awaited<ReturnType<typeof inboxApi.getConnection>>;
type ConnectResult = Awaited<ReturnType<typeof inboxApi.connectOAuthPage>>;

const view = (connected: boolean) => ({ data: { connected } }) as unknown as Connection;

afterEach(() => vi.restoreAllMocks());

/**
 * Connecting a Page from the picker: the picker closes on success, so success must mean the
 * connection view already says "connected" — otherwise the settings page shows Connect with
 * Facebook again for a moment (the App Review recording, 2026-10-25).
 */
describe("useConnectInboxOAuthPage", () => {
  it("counts as done only once the connection has refetched", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <TestProviders client={client}>{children}</TestProviders>;
    let connected = false;
    vi.spyOn(inboxApi, "getConnection").mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(view(connected)), 50)),
    );
    vi.spyOn(inboxApi, "connectOAuthPage").mockImplementation(async () => {
      connected = true;
      return { data: {}, message: "Facebook Page connected" } as unknown as ConnectResult;
    });

    const { result } = renderHook(() => ({ connection: useInboxConnection(), connect: useConnectInboxOAuthPage() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.connection.data?.connected).toBe(false));

    const seenOnDone: (boolean | undefined)[] = [];
    act(() => {
      result.current.connect.mutate(
        { grant: "grant", pageId: "107287100788819" },
        { onSuccess: () => seenOnDone.push(client.getQueryData<Connection>(queryKeys.inbox.connection())?.data.connected) },
      );
    });
    await waitFor(() => expect(seenOnDone).toHaveLength(1));
    expect(seenOnDone[0]).toBe(true);
  });
});
