import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "./test-utils";

describe("test infrastructure smoke", () => {
  it("renders a component with providers", () => {
    renderWithProviders(<div>vitest-ok</div>);
    expect(screen.getByText("vitest-ok")).toBeInTheDocument();
  });
});
