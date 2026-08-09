"use client";
// coding-standard: maintained

import { useHydrated } from "@/hooks/use-hydrated";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { StorefrontContactButton } from "@/types";

type Hours = NonNullable<StorefrontContactButton["hours"]>;

/**
 * Is the merchant outside their stated reply hours right now, and what should
 * the launcher say about it.
 *
 * **Gated on `useHydrated`.** This reads the visitor's clock, so computing it
 * during SSR would bake the *server's* "now" into the HTML — a shop rendered at
 * 2 a.m. on the server would ship "Away" to a shopper browsing at noon, and the
 * first client render would disagree with it. Before hydration it always answers
 * "open", which is the safe default: a shopper who messages an away merchant
 * still becomes a lead, where a wrongly-away button loses one.
 *
 * The comparison runs in the VISITOR's timezone, not the merchant's. That is a
 * real limitation and a deliberate one for now: the storefront has no reliable
 * merchant timezone on the public payload, and for a Bangladeshi shop with
 * Bangladeshi shoppers the two agree. Revisit when a store first sells abroad —
 * the fix is a timezone on the settings block, not a change here.
 */
export function useContactHours(hours: Hours | undefined): {
  isAway: boolean;
  note?: string;
} {
  const hydrated = useHydrated();
  const { t } = useStorefrontUI();

  if (!hydrated || !hours?.enabled) return { isAway: false };

  const from = parseHm(hours.from);
  const to = parseHm(hours.to);
  if (from === null || to === null) return { isAway: false };

  const now = new Date();
  const days = hours.days?.length ? hours.days : [0, 1, 2, 3, 4, 5, 6];
  const openToday = days.includes(now.getDay());
  const minutes = now.getHours() * 60 + now.getMinutes();

  // A window that wraps midnight ("20:00"–"02:00") is inclusive of both ends of
  // the wrap, not an empty range — the naive `from <= n && n < to` reads it as
  // "never open" and would strand a late-night shop permanently away.
  const withinWindow =
    from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;

  if (openToday && withinWindow) return { isAway: false };

  return {
    isAway: true,
    note: hours.offlineNote?.trim() || t.chatAway.replace("{when}", formatHm(hours.from)),
  };
}

/** "HH:mm" → minutes since midnight, or null when the merchant left it blank. */
function parseHm(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** "10:00" → "10:00 AM", for the away note. */
function formatHm(value: string | undefined): string {
  const minutes = parseHm(value);
  if (minutes === null) return "";
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(minutes % 60).padStart(2, "0");
  return `${h12}:${mm} ${h24 < 12 ? "AM" : "PM"}`;
}
