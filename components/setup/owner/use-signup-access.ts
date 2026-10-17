// coding-standard: maintained
import { useMemo, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { useSignupOptions } from "@/services/api";
import type { AvailablePlan } from "@/types";
import { groupPlans } from "@/utils/plan-groups";
import {
  getSignupKeyFromUrl,
  getSignupPlanFromUrl,
  initialSignupPlanSlug,
  type SignupPlanFromUrl,
} from "@/utils/signup-plan";

export type SignupAccessStatus = "loading" | "closed" | "open";

/**
 * Whether this visitor may use the signup form, and which plan they picked.
 *
 * Self-signup can be closed to the team's key (backend `SIGNUP_ACCESS_KEY`,
 * `/signup?key=…`); the backend answers per key through
 * `GET /public/signup-options` and also returns the plans on sale.
 *
 * **A failed lookup opens the form, it does not close it.** The backend refuses
 * a keyless signup on its own, so failing open costs nothing in safety, and it
 * keeps the page working against a backend that predates the endpoint (a
 * frontend deployed first) or a Mission Control that is down — the form then
 * falls back to the plan the URL named, exactly as before.
 */
export function useSignupAccess() {
  const hydrated = useHydrated();
  // The URL is client-only: read after hydration. Asking for options before the key is read
  // would answer "closed" to the team for a moment, so `urlRead` gates the query.
  const urlRead = hydrated;
  const key = useMemo(
    () => (hydrated ? getSignupKeyFromUrl() : undefined),
    [hydrated],
  );
  const urlPlan = useMemo<SignupPlanFromUrl>(
    () => (hydrated ? getSignupPlanFromUrl() : {}),
    [hydrated],
  );
  // The visitor's pick; until they pick, the starting plan below.
  const [pickedPlanSlug, setPlanSlug] = useState<string | undefined>();

  const options = useSignupOptions(key, urlRead);
  const plans = useMemo(
    () => (options.data?.plans ?? []) as AvailablePlan[],
    [options.data],
  );
  const groups = useMemo(() => groupPlans(plans), [plans]);

  // Derived, not copied into state in an effect: the plan list arrives after mount. Until the
  // visitor picks, the URL's plan when on sale, else the entry plan.
  const planSlug =
    pickedPlanSlug ??
    (groups.length > 0
      ? initialSignupPlanSlug(groups, urlPlan.planSlug)
      : undefined);

  const status: SignupAccessStatus =
    !urlRead || options.isPending
      ? "loading"
      : options.data && !options.data.allowed
      ? "closed"
      : "open";

  /** The plan fields the signup request sends: the picked plan, else the URL's. */
  const planPayload = (): SignupPlanFromUrl => {
    const group = groups.find((g) =>
      g.variants.some((v) => v.slug === planSlug),
    );
    return planSlug && group ? { planSlug, planName: group.name } : urlPlan;
  };

  return { status, key, plans, planSlug, setPlanSlug, planPayload };
}
