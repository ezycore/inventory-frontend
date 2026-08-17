// coding-standard: maintained

/** The plan fields signup sends to the backend, when the URL carries one. */
export interface SignupPlanFromUrl {
  planName?: string;
  planSlug?: string;
}

/**
 * Query params that carry a chosen plan across from the marketing site.
 *
 * Two readers, which is why this is not inline in the signup page any more: the
 * submit handler sends these fields, and `SignupPlanNote` shows the merchant
 * which plan they are signing up for.
 *
 * **Sends nothing when no plan was chosen** — Mission Control then picks the
 * entry plan (first public + active by sort order). Defaulting to a hardcoded
 * slug here would break every direct signup the day that plan is renamed, which
 * is also why the note renders no plan name in that case rather than a guess.
 *
 * Reads `window.location.search`, so callers rendering the result must gate on
 * `useHydrated()`.
 */
export function getSignupPlanFromUrl(): SignupPlanFromUrl {
  const params = new URLSearchParams(window.location.search);
  const planName =
    params.get("planName") || params.get("plan") || params.get("planSlug");
  const planSlug = params.get("planSlug") || undefined;

  return {
    ...(planName?.trim() && { planName: planName.trim() }),
    ...(planSlug && { planSlug }),
  };
}
