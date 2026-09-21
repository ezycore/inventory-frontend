// coding-standard: maintained
/**
 * A session is signed in only while it holds a bearer token.
 *
 * The store used to take whatever second argument it was handed, and
 * `tsconfig` has `strict: false`, so a `string | null` reached a `string`
 * parameter without a compile error. `useMe` passed a render-time snapshot of
 * the token, so a `clearAuth` landing while `/auth/me` was in flight wrote the
 * user back with a null token: `isAuthenticated: true`, no bearer, and
 * `api-client` sending every request unauthenticated — a 401 on the next call
 * and a bounce to /login, repeating after every fresh login. That state was
 * found persisted in a real browser (`easystock-auth`: user + isAuthenticated,
 * empty token), which is what made the setup wizard's first answer 401.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore, type User } from "../use-auth-store";

const someUser = (): User =>
  ({
    id: "u1",
    email: "owner@example.test",
    role: "admin",
    permissions: [],
    organization: { name: "Acme", slug: "acme" },
  }) as unknown as User;

const state = () => useAuthStore.getState();

beforeEach(() => {
  localStorage.clear();
  state().clearAuth();
});

describe("auth store — the bearer token is never half-cleared", () => {
  it("keeps the current token when setUser is called without one", () => {
    state().setUser(someUser(), "live-token");

    // What a `/auth/me` refresh looks like: a fresh user, no token in the
    // response, and a caller that no longer has one to hand back.
    state().setUser(
      { ...someUser(), firstName: "Refreshed" },
      null as unknown as string,
    );

    expect(state().token).toBe("live-token");
    expect(state().isAuthenticated).toBe(true);
    expect(state().user?.firstName).toBe("Refreshed");
  });

  it("refuses to sign a session in with no token at all", () => {
    state().setUser(someUser(), "" as string);

    expect(state().token).toBeNull();
    expect(state().isAuthenticated).toBe(false);
    expect(state().user).toBeNull();
  });

  it("setToken ignores an empty token rather than dropping the bearer", () => {
    state().setUser(someUser(), "live-token");

    state().setToken("" as string);

    expect(state().token).toBe("live-token");
    expect(state().isAuthenticated).toBe(true);
  });

  it("clearAuth still clears the whole session", () => {
    state().setUser(someUser(), "live-token");

    state().clearAuth();

    expect(state().token).toBeNull();
    expect(state().user).toBeNull();
    expect(state().isAuthenticated).toBe(false);
  });
});
