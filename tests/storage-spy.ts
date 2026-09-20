// coding-standard: maintained
import { vi } from "vitest";

/**
 * Make `localStorage` / `sessionStorage` fail the way a private window or a full
 * quota does.
 *
 * **Why this is not `vi.spyOn(Storage.prototype, …)`.** Vitest runs Node with
 * its own Web Storage enabled, and that global shadows jsdom's: the object the
 * app writes to is a Node `Storage`, whose methods live on a different
 * prototype from the `Storage` class jsdom exports. A prototype spy therefore
 * patches a class nothing is using, and — the part that bites — the spy still
 * installs cleanly, so the test goes green having simulated nothing at all.
 * `storefront-attribution.test.ts` held one of those for exactly that reason.
 *
 * Spying the instance does not work either: Node's storage is exotic, and
 * `vi.spyOn` cannot define an own property on it. Its own prototype is the one
 * place a spy both applies and restores.
 */
export const spyOnStorage = (storage: Storage, method: "getItem" | "setItem") =>
  vi.spyOn(Object.getPrototypeOf(storage) as Storage, method);
