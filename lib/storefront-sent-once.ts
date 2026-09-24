// coding-standard: maintained

/**
 * "Has this browser already reported this?" — for events that must go out once per id, however
 * often the page that sends them is reloaded (a purchase on the thank-you screen).
 *
 * A module-level `Set` alone would die with the tab, and the thank-you screen is exactly the page
 * a shopper reloads or returns to with the back button. `sessionStorage` carries the ids across
 * those; the `Set` is the fallback where storage throws (Safari private mode) and still covers the
 * in-page case. Each caller passes its own `namespace` (its storage key), so Meta and GA4 keep
 * separate books and one tool's send never suppresses the other's.
 */
const memory = new Map<string, Set<string>>();

const seen = (namespace: string): Set<string> => {
  let set = memory.get(namespace);
  if (!set) {
    set = new Set();
    memory.set(namespace, set);
  }
  return set;
};

export const alreadySent = (namespace: string, id: string): boolean => {
  if (seen(namespace).has(id)) return true;
  try {
    const raw = window.sessionStorage.getItem(namespace);
    return !!raw && (JSON.parse(raw) as string[]).includes(id);
  } catch {
    return false;
  }
};

/**
 * Record `id` as sent. Callers mark BEFORE sending: the senders swallow their own failures, so a
 * throw would otherwise leave the id unrecorded and let a re-render try again.
 */
export const rememberSent = (namespace: string, id: string): void => {
  seen(namespace).add(id);
  try {
    const raw = window.sessionStorage.getItem(namespace);
    const stored = raw ? (JSON.parse(raw) as string[]) : [];
    // Bounded: more than a handful of orders in one session is not worth unbounded storage.
    const next = [...stored.filter((x) => x !== id), id].slice(-20);
    window.sessionStorage.setItem(namespace, JSON.stringify(next));
  } catch {
    // Storage blocked. The in-memory Set still covers this tab.
  }
};
