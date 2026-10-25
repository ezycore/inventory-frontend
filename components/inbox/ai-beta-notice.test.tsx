// coding-standard: maintained
import { renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it } from "vitest";
import { AiBetaNotice } from "./ai-beta-notice";

/** The beta notice at the top of Inbox settings: it tells the merchant to flag wrong replies. */
describe("AiBetaNotice", () => {
  it("says AI replies are in beta and points at Flag", () => {
    renderWithProviders(<AiBetaNotice />);
    expect(screen.getByText("AI replies are in beta")).toBeInTheDocument();
    expect(screen.getByText(/press Flag on any reply it gets wrong/)).toBeInTheDocument();
  });
});
