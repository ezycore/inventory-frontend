// coding-standard: maintained

/** The plan fields signup sends to the backend, when the URL carries one. */
export interface SignupPlanFromUrl {
  planName?: string;
  planSlug?: string;
}

/** Cadence suffixes a billing slug carries; the package name is what precedes them. */
const CADENCE_SUFFIXES = ["monthly", "yearly", "annual", "annually", "quarterly"];

/**
 * Turn a billing slug into the package name the pricing page showed.
 *
 * `growth-monthly` → `Growth`, `pro-plus-yearly` → `Pro Plus`, `starter` →
 * `Starter`. The cadence is dropped because the visitor picked it on a card
 * that said "Growth", and repeating "monthly" in a plan *name* reads as a
 * different plan.
 *
 * Best-effort by design: this is display text only (`planName` never resolves a
 * plan — `planSlug` does), so a slug shaped unlike ours degrades to a
 * title-cased version of itself rather than throwing.
 */
export function prettyPlanName(slug: string): string {
  const parts = slug.trim().toLowerCase().split(/[-_\s]+/).filter(Boolean);
  if (parts.length === 0) return slug.trim();
  const last = parts[parts.length - 1];
  const words =
    parts.length > 1 && CADENCE_SUFFIXES.includes(last)
      ? parts.slice(0, -1)
      : parts;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Query params that carry a chosen plan across from the marketing site.
 *
 * Two readers, which is why this is not inline in the signup page any more: the
 * submit handler sends these fields, and `SignupPlanNote` shows the merchant
 * which plan they are signing up for.
 *
 * **`?plan=` is a SLUG, not a name.** `easystock-marketing` builds every
 * pricing CTA as `signupUrl({ plan: p.slug })` — its own comment says the link
 * "carries the SELECTED variant's slug, so the signup lands on the cadence the
 * visitor is looking at". This function used to map that value to `planName`
 * only, leaving `planSlug` undefined; `auth.service` forwards `planSlug` to
 * Mission Control **only when present**, and MC falls back to the entry plan
 * when it is absent. So every visitor who clicked "Start with Growth" was
 * provisioned on the entry plan, and the raw slug in the signup badge was the
 * visible symptom of it (QA-097 / QA-112).
 *
 * `planName` is display text only and never resolves a plan, so deriving it
 * from the slug is safe.
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
  const slug = (params.get("planSlug") || params.get("plan"))?.trim();
  const explicitName = params.get("planName")?.trim();
  const planName = explicitName || (slug ? prettyPlanName(slug) : undefined);

  return {
    ...(planName && { planName }),
    ...(slug && { planSlug: slug }),
  };
}

/**
 * The team's signup key from `/signup?key=…`, while self-signup is closed
 * (backend `SIGNUP_ACCESS_KEY`). The backend decides whether it is right; this
 * only carries it. Reads `window.location`, so gate callers on `useHydrated()`.
 */
export function getSignupKeyFromUrl(): string | undefined {
  return new URLSearchParams(window.location.search).get("key")?.trim() || undefined;
}

/**
 * Which plan the signup picker opens on: the plan the link named when it is on
 * sale, else the entry plan — the first package's shortest cycle, the same plan
 * Mission Control gives a signup that names none. `undefined` with no plans.
 *
 * A named slug that is NOT on sale is not honoured silently: the picker opens on
 * the entry plan where the person can see it, instead of the backend refusing a
 * form that had no plan control on it.
 */
export function initialSignupPlanSlug<P extends { slug: string }>(
  groups: Array<{ variants: P[] }>,
  requestedSlug?: string,
): string | undefined {
  const all = groups.flatMap((g) => g.variants);
  if (requestedSlug && all.some((p) => p.slug === requestedSlug)) return requestedSlug;
  return groups[0]?.variants[0]?.slug;
}
