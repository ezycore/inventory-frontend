// coding-standard: maintained
import type { InboxConnection } from "@/services/api";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it } from "vitest";
import { ConnectionStatus } from "./connection-status";

const META_REASON =
  "Meta rejected the token: Error validating access token: The user has not authorized application 1524933855781612.";

const connection = (overrides: Partial<InboxConnection>): InboxConnection =>
  ({
    connected: true,
    source: "platform",
    status: "active",
    pageId: "107287100788819",
    pageName: "Rafi Medicine Centre",
    oauthAvailable: true,
    aiAvailable: false,
    ...overrides,
  }) as InboxConnection;

/** The connection card: a Page connected with Facebook that lost Facebook's permission is fixed in place. */
describe("ConnectionStatus", () => {
  it("lost Facebook's permission: plain words, not Meta's, and the reconnect button first", () => {
    renderWithProviders(
      <ConnectionStatus connection={connection({ status: "token_invalid", statusReason: META_REASON })} />,
    );
    expect(screen.getByText(/Facebook no longer lets ezycore use this Page/)).toBeInTheDocument();
    expect(screen.queryByText(/Error validating access token/)).not.toBeInTheDocument();
    const buttons = screen.getAllByRole("button").map((button) => button.textContent);
    expect(buttons[0]).toBe("Connect with Facebook again");
    expect(buttons).toContain("Disconnect");
  });

  it("no reconnect button while Connect with Facebook is switched off on this server", () => {
    renderWithProviders(<ConnectionStatus connection={connection({ status: "token_invalid", oauthAvailable: false })} />);
    expect(screen.getByText(/Facebook no longer lets ezycore use this Page/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect with Facebook again" })).not.toBeInTheDocument();
  });

  it("the shop's own app: Meta's reason as it came, since the fix is a new token they paste", () => {
    renderWithProviders(
      <ConnectionStatus connection={connection({ source: "byo", status: "token_invalid", statusReason: META_REASON })} />,
    );
    expect(screen.getByText(META_REASON)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect with Facebook again" })).not.toBeInTheDocument();
  });

  it("healthy: no reconnect button", () => {
    renderWithProviders(<ConnectionStatus connection={connection({})} />);
    expect(screen.queryByRole("button", { name: "Connect with Facebook again" })).not.toBeInTheDocument();
  });
});
