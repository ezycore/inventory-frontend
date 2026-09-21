"use client";
// coding-standard: maintained
/**
 * The signed-in organization's calendar — its timezone and week start, both
 * resolved (CLAUDE.md → "Timezones"). Read this instead of the browser's zone.
 */

import { resolveTimezone, resolveWeekStartDay } from "@/lib/org-calendar";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * The org's resolved timezone outside React — for render functions that are not
 * components (DataCard card views, print builders). Reads the store snapshot.
 */
export function getOrgTimezone(): string {
  return resolveTimezone(useAuthStore.getState().user?.organization?.timezone);
}

export function useOrgCalendar(): { timezone: string; weekStartDay: number } {
  const timezone = useAuthStore((s) => s.user?.organization?.timezone);
  const weekStartDay = useAuthStore((s) => s.user?.organization?.weekStartDay);
  return {
    timezone: resolveTimezone(timezone),
    weekStartDay: resolveWeekStartDay(weekStartDay),
  };
}
