import { http, HttpResponse } from "msw";

/**
 * Default MSW handlers. Per-test overrides should call
 * `server.use(http.method(url, resolver))` inside the test.
 *
 * Keep this list small — only handlers shared across many suites.
 */
export const handlers = [
  http.get("*/api/health", () =>
    HttpResponse.json({ success: true, data: { ok: true } }),
  ),
  // Both login screens ask whether self-signup is open (`SignupPrompt`).
  http.get("*/api/public/signup-options", () =>
    HttpResponse.json({
      success: true,
      data: { selfSignup: true, allowed: true, plans: [] },
    }),
  ),
];
