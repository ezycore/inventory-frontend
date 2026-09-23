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
/*
 * ⚠ `sessionStorage` deliberately gets NO such shim, even though the preview
 * receivers now read it (`isPreviewSession`). Node's own works — it is only
 * `localStorage` that arrives without `setItem` — and swapping in a plain
 * object would take it off the prototype `tests/storage-spy.ts` patches to
 * simulate a blocked or full store.
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

/**
 * jsdom implements no Pointer Capture API and no `scrollIntoView`, and Radix
 * calls both the moment a `Select` / `DropdownMenu` trigger is opened — so a
 * `user.click()` on one throws `target.hasPointerCapture is not a function`
 * and the popover never mounts. The failure reads as "unable to find an element
 * with the role option", which points at the assertion rather than at the
 * missing DOM API, so it is worth stubbing once here rather than rediscovering
 * per test file.
 *
 * These are no-ops on purpose: nothing under test asserts on capture or scroll
 * behaviour, only on what the open popover renders.
 */
/**
 * jsdom has no `ResizeObserver` either, and `cmdk` (the multi-select's option
 * list) constructs one on mount — so rendering that control throws
 * `ResizeObserver is not defined` before a single assertion runs. Same reasoning
 * as the stubs below: nothing under test asserts on resize behaviour, and jsdom
 * has no layout for it to observe.
 */
if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
}

for (const name of [
  "hasPointerCapture",
  "setPointerCapture",
  "releasePointerCapture",
  "scrollIntoView",
] as const) {
  if (!(name in Element.prototype)) {
    Object.defineProperty(Element.prototype, name, {
      configurable: true,
      writable: true,
      // `hasPointerCapture` must answer a boolean; the rest are void.
      value: name === "hasPointerCapture" ? () => false : () => {},
    });
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Preview mode is sticky per tab (`isPreviewSession`), and a test file's
  // "tab" is the whole file — without this, one case that previews leaves every
  // later case in the same file previewing too.
  try {
    window.sessionStorage.clear();
  } catch {
    /* storage unavailable — nothing to clear */
  }
});
afterAll(() => server.close());
