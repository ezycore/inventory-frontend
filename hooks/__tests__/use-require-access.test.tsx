// coding-standard: maintained

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The permission guard five settings pages share.
 *
 * Each page used to carry its own `if (user && !canManage)` effect, and every
 * copy had the same hole: a truthy `user` does not mean the permission list has
 * arrived. Any render where the session exists but `permissions` is still
 * undefined read as "signed in, allowed nothing", so the page accused a
 * merchant who holds the permission and bounced them to the dashboard — the
 * false message seen at t≈1,544 ms (QA-R21).
 *
 * The distinction under test is **absent vs empty**. An empty array is the
 * server saying this user holds nothing, and acting on it is correct. Absent is
 * nobody having said anything yet, and acting on it is the bug.
 */

const push = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

const store = {
  user: null as { permissions?: string[] } | null,
  isAuthenticated: false,
};

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
}));

import { useRequireAccess } from "../use-require-access";

const signedIn = (permissions?: string[]) => {
  store.user = permissions === undefined ? {} : { permissions };
  store.isAuthenticated = true;
};

beforeEach(() => {
  push.mockClear();
  toastError.mockClear();
  store.user = null;
  store.isAuthenticated = false;
});

describe("useRequireAccess", () => {
  it("stays silent while permissions have not arrived", () => {
    // The regression. `user` is truthy, the permission resolves false, and the
    // page must NOT act on that.
    signedIn(undefined);

    renderHook(() => useRequireAccess([{ allowed: false, message: "nope" }]));

    expect(toastError).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("acts once permissions are known and empty", () => {
    signedIn([]);

    renderHook(() => useRequireAccess([{ allowed: false, message: "nope" }]));

    expect(toastError).toHaveBeenCalledWith("nope");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("stays silent while signing out", () => {
    // The session is going away and the protected layout owns that redirect.
    store.user = { permissions: [] };
    store.isAuthenticated = false;

    renderHook(() => useRequireAccess([{ allowed: false, message: "nope" }]));

    expect(toastError).not.toHaveBeenCalled();
  });

  it("says nothing when every requirement is met", () => {
    signedIn(["organization.edit"]);

    renderHook(() => useRequireAccess([{ allowed: true, message: "nope" }]));

    expect(toastError).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("reports the first failing requirement, not both", () => {
    // The receipt page's shape: no permission AND the feature off. Two toasts
    // racing to the same screen is what the ordering exists to prevent.
    signedIn([]);

    renderHook(() =>
      useRequireAccess([
        { allowed: false, message: "no permission" },
        { allowed: false, message: "not enabled" },
      ]),
    );

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("no permission");
  });

  it("falls through to the second requirement when the first passes", () => {
    signedIn(["organization.edit"]);

    renderHook(() =>
      useRequireAccess([
        { allowed: true, message: "no permission" },
        { allowed: false, message: "not enabled" },
      ]),
    );

    expect(toastError).toHaveBeenCalledWith("not enabled");
  });

  it("does not re-toast when the component re-renders", () => {
    // `requirements` is a fresh array literal every render, and the mocked
    // `useRouter` deliberately returns a fresh object each call — nothing
    // promises Next's is stable either. Both would re-run the effect with
    // nothing meaningful changed, so the guard is a ref, not a dependency
    // list. This caught a real second toast in the hook itself.
    signedIn([]);

    const { rerender } = renderHook(() =>
      useRequireAccess([{ allowed: false, message: "nope" }]),
    );
    rerender();
    rerender();

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("reports a second, different refusal", () => {
    // Keyed on the message rather than a bare "already fired" flag: the
    // receipt page can go from "no permission" to "not enabled", and the
    // first must not silence the second.
    signedIn([]);

    const { rerender } = renderHook(
      ({ msg }: { msg: string }) =>
        useRequireAccess([{ allowed: false, message: msg }]),
      { initialProps: { msg: "no permission" } },
    );
    rerender({ msg: "not enabled" });

    expect(toastError).toHaveBeenNthCalledWith(1, "no permission");
    expect(toastError).toHaveBeenNthCalledWith(2, "not enabled");
  });
});
