// coding-standard: maintained
import { useEffect, useMemo, useState } from "react";

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
  const [key, setKey] = useState<string | undefined>();
  const [urlPlan, setUrlPlan] = useState<SignupPlanFromUrl>({});
  const [planSlug, setPlanSlug] = useState<string | undefined>();
  // Asking before the key is read would answer "closed" to the team for a moment.
  const [urlRead, setUrlRead] = useState(false);

  // The URL is client-only; read it once after hydration.
  useEffect(() => {
    if (!hydrated) return;
    setKey(getSignupKeyFromUrl());
    setUrlPlan(getSignupPlanFromUrl());
    setUrlRead(true);
  }, [hydrated]);

  const options = useSignupOptions(key, urlRead);
  const plans = useMemo(
    () => (options.data?.plans ?? []) as AvailablePlan[],
    [options.data],
  );
  const groups = useMemo(() => groupPlans(plans), [plans]);

  // Pick the starting plan once the list arrives: the URL's when on sale, else the entry plan.
  useEffect(() => {
    if (planSlug === undefined && groups.length > 0) {
      setPlanSlug(initialSignupPlanSlug(groups, urlPlan.planSlug));
    }
  }, [groups, planSlug, urlPlan.planSlug]);

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
