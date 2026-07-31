import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

/**
 * Node 20+ exposes its own `localStorage` global, which shadows jsdom's and is
 * inert without `--localstorage-file` — the object is there but `setItem` is
 * not, so every persisted zustand store (`easystock-auth`, the cart) throws
 * "storage.setItem is not a function" the first time a test writes to it.
 * Swap in a real in-memory Storage when that shadow is detected.
 */
if (typeof globalThis.localStorage?.setItem !== "function") {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
  };
  for (const target of [globalThis, window]) {
    Object.defineProperty(target, "localStorage", {
      configurable: true,
      writable: true,
      value: memoryStorage,
    });
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
