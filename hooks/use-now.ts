"use client";
// coding-standard: maintained
import { useEffect, useState } from "react";

/**
 * The current time, re-read on an interval, for UI that shows an AGE rather than
 * a timestamp.
 *
 * A relative label computed once at render is wrong from the second it paints:
 * the orders list prints how long each order has been waiting, and a queue a
 * merchant leaves open on a second monitor kept saying `3m` twenty minutes
 * later. Age is the entire reason that column replaced a date, so a stale one is
 * worse than the date it replaced — it looks live and is not.
 *
 * **Call it once per LIST and pass the value down**, never inside the row. A
 * hook in the row is one interval per row, so a page of a hundred orders sets a
 * hundred timers to answer one question.
 *
 * Returns a `Date` so callers can pass it straight to the pure formatters that
 * take an injectable `now` (`orderAge`) — which is what keeps those testable
 * without touching the wall clock.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Server and first client render must agree, so the initial value is the
    // lazy `useState` above and the ticking starts only after mount.
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
