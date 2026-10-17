// coding-standard: maintained
import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { server } from "@/tests/mocks/server";
import { TestProviders } from "@/tests/test-utils";
import type { AvailablePlan } from "@/types";
import { useSignupAccess } from "./use-signup-access";

/**
 * The signup page's gate: reads `?key=` / `?plan=` after hydration, asks the
 * server whether this visitor may sign up, and starts the picker on the
 * URL's plan (else the entry plan) until the visitor picks another.
 */
const plan = (
  group: string,
  rank: number,
  interval: "month" | "year",
): AvailablePlan => ({
  id: `${group}-${interval}`,
  name: group,
  slug: `${group}-${interval === "month" ? "monthly" : "yearly"}`,
  interval,
  amount: rank * 100,
  group,
  groupRank: rank,
  modules: [],
  features: [],
});
const PLANS = [
  plan("start", 1, "month"),
  plan("start", 1, "year"),
  plan("growth", 2, "month"),
  plan("growth", 2, "year"),
];

const answer = (data: {
  selfSignup: boolean;
  allowed: boolean;
  plans: AvailablePlan[];
}) =>
  server.use(
    http.get("*/api/public/signup-options", ({ request }) =>
      HttpResponse.json({
        success: true,
        data: { ...data, key: new URL(request.url).searchParams.get("key") },
      }),
    ),
  );

const render = () =>
  renderHook(() => useSignupAccess(), { wrapper: TestProviders });

afterEach(() => window.history.replaceState(null, "", "/"));

describe("useSignupAccess", () => {
  it("is closed to a visitor the server does not allow", async () => {
    answer({ selfSignup: false, allowed: false, plans: [] });
    const { result } = render();
    await waitFor(() => expect(result.current.status).toBe("closed"));
  });

  it("reads the team key and the URL's plan, then lets the visitor pick another", async () => {
    window.history.replaceState(
      null,
      "",
      "/signup?key=team-key&plan=growth-yearly",
    );
    answer({ selfSignup: false, allowed: true, plans: PLANS });
    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("open"));
    expect(result.current.key).toBe("team-key");
    await waitFor(() => expect(result.current.planSlug).toBe("growth-yearly"));
    expect(result.current.planPayload()).toMatchObject({
      planSlug: "growth-yearly",
    });

    act(() => result.current.setPlanSlug("start-monthly"));
    expect(result.current.planSlug).toBe("start-monthly");
  });

  it("starts on the entry plan when the link names none", async () => {
    answer({ selfSignup: true, allowed: true, plans: PLANS });
    const { result } = render();
    await waitFor(() => expect(result.current.planSlug).toBe("start-monthly"));
  });
});
