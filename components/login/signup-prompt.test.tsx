// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { SignupPrompt } from "./signup-prompt";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("SignupPrompt", () => {
  it("links to signup while self-signup is open", async () => {
    renderWithProviders(<SignupPrompt />);
    expect(await screen.findByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });

  it("sends a newcomer to the contact page while self-signup is closed", async () => {
    server.use(
      http.get("*/api/public/signup-options", () =>
        HttpResponse.json({
          success: true,
          data: { selfSignup: false, allowed: false, plans: [] },
        }),
      ),
    );
    renderWithProviders(<SignupPrompt />);
    const link = await screen.findByRole("link", { name: "Talk to us" });
    expect(link.getAttribute("href")).toMatch(/\/en\/contact\/$/);
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
  });
});
