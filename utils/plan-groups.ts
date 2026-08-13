// coding-standard: maintained
/**
 * Grouping and plan-change direction for the billing page.
 *
 * A tier sold monthly *and* yearly is TWO plans in Mission Control sharing a
 * `group` (`start-monthly` + `start-yearly`, both `group: "start"`). The slug is
 * the billing key, so each cadence must stay its own plan; this module is what
 * lets the UI show them as one card with a billing-cycle switch.
 *
 * **`resolvePlanChangeDirection` is a cross-repo contract.** It mirrors
 * `mission-control/src/utils/plan-change-direction.ts` and must change in
 * lockstep with it. This side only labels a button ("Upgrade" / "Downgrade");
 * Mission Control decides what actually happens — charge now, or schedule for
 * period end. When the two disagree the button lies: a card reading "Downgrade"
 * that immediately takes the customer's money is the failure mode.
 */
import type { AvailablePlan } from "@/types";

export type PlanChangeDirection = "upgrade" | "downgrade";

/** One pricing card: a package plus the cadences it can be bought on. */
export interface PlanGroup {
  /** `group` when set, else the plan's own slug — stable React key. */
  key: string;
  name: string;
  /** Lowest rank among the variants; ungrouped plans sort last. */
  rank: number;
  /** Cadence variants, shortest billing period first. */
  variants: AvailablePlan[];
}

/** A billing cycle offered somewhere in the plan set, keyed by its month count. */
export interface PlanCadence {
  months: number;
  /** Best whole-number per-month saving vs the shortest cycle; null when none. */
  savePct: number | null;
}

/**
 * ISO date a trial of `days` would end if it started now.
 *
 * Lives here rather than inline in the billing component because reading the
 * clock is impure: React's purity lint rejects `Date.now()` anywhere in a
 * component body, and it cannot tell that the call site is only ever reached
 * from a click handler. A plain module function is the honest home for it, and
 * it is testable on its own.
 */
export function trialEndDateFrom(days: number, now = Date.now()): string {
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Total months a billing period covers; null for one_time (no cadence). */
export function monthsOf(plan: {
  interval: string;
  intervalCount?: number;
}): number | null {
  const n = Math.max(1, plan.intervalCount ?? 1);
  if (plan.interval === "year") return n * 12;
  if (plan.interval === "month") return n;
  return null;
}

/**
 * Direction of a change from `current` to `target`.
 *
 * Tier rank is compared first and cadence only breaks a tie inside one package,
 * because neither price rule works alone: raw amount calls Start-yearly (৳3,990)
 * → Pro-monthly (৳999) a downgrade, and a per-month normalisation calls
 * Start-monthly → Start-yearly one. Falls back to raw amount when the plans
 * carry no grouping, so ungrouped plans behave exactly as before.
 */
export function resolvePlanChangeDirection(
  current: AvailablePlan,
  target: AvailablePlan,
): PlanChangeDirection {
  const sameGroup = !!current.group && !!target.group && current.group === target.group;

  if (sameGroup) {
    const currentMonths = monthsOf(current);
    const targetMonths = monthsOf(target);
    if (
      currentMonths !== null &&
      targetMonths !== null &&
      currentMonths !== targetMonths
    ) {
      return targetMonths > currentMonths ? "upgrade" : "downgrade";
    }
  } else if (
    typeof current.groupRank === "number" &&
    typeof target.groupRank === "number" &&
    current.groupRank !== target.groupRank
  ) {
    return target.groupRank > current.groupRank ? "upgrade" : "downgrade";
  }

  return target.amount < current.amount ? "downgrade" : "upgrade";
}

/** Collapse the flat plan list into one entry per package. */
export function groupPlans(plans: AvailablePlan[]): PlanGroup[] {
  const byKey = new Map<string, PlanGroup>();

  for (const plan of plans) {
    const key = plan.group ?? plan.slug;
    const existing = byKey.get(key);
    if (existing) {
      existing.variants.push(plan);
      if (typeof plan.groupRank === "number") {
        existing.rank = Math.min(existing.rank, plan.groupRank);
      }
      continue;
    }
    byKey.set(key, {
      key,
      name: plan.name,
      rank: plan.groupRank ?? Number.MAX_SAFE_INTEGER,
      variants: [plan],
    });
  }

  const groups = [...byKey.values()];
  for (const g of groups) {
    g.variants.sort(
      (a, b) => (monthsOf(a) ?? Number.MAX_SAFE_INTEGER) - (monthsOf(b) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  return groups.sort(
    (a, b) => a.rank - b.rank || (a.variants[0]?.amount ?? 0) - (b.variants[0]?.amount ?? 0),
  );
}

/**
 * The distinct billing cycles worth offering as a switch, shortest first.
 *
 * Only packages that actually sell more than one cadence are considered. Without
 * that filter a set of ungrouped plans (each a group of one) still yields
 * several month counts and renders an **inert** switch — every card would fall
 * back to its only variant, so clicking changes nothing. Returns `[]` when there
 * is nothing to switch between, and the caller then renders no control at all.
 */
export function planCadences(groups: PlanGroup[]): PlanCadence[] {
  const switchable = groups.filter((g) => g.variants.length > 1);
  if (switchable.length === 0) return [];

  const monthSet = new Set<number>();
  for (const g of switchable) {
    for (const v of g.variants) {
      const m = monthsOf(v);
      if (m !== null) monthSet.add(m);
    }
  }
  const months = [...monthSet].sort((a, b) => a - b);
  if (months.length < 2) return [];

  const baseline = months[0];
  return months.map((m) => ({
    months: m,
    savePct: m === baseline ? null : bestSavingAt(groups, m, baseline),
  }));
}

/**
 * Largest whole-number per-month saving any package offers at `months` versus
 * its own `baseline` cadence. Compared within a package, never across packages —
 * a pricier tier's annual price must not advertise a saving on the entry tier.
 */
function bestSavingAt(
  groups: PlanGroup[],
  months: number,
  baseline: number,
): number | null {
  let best: number | null = null;
  for (const g of groups) {
    const from = g.variants.find((v) => monthsOf(v) === baseline);
    const to = g.variants.find((v) => monthsOf(v) === months);
    if (!from?.amount || !to?.amount) continue;
    const pct = Math.round((1 - to.amount / months / (from.amount / baseline)) * 100);
    if (pct > 0 && (best === null || pct > best)) best = pct;
  }
  return best;
}

/**
 * The variant a card should show for the selected cadence: an exact match, else
 * the package's default (shortest period). A package that does not sell the
 * selected cycle still renders its own price rather than vanishing mid-toggle.
 */
export function variantFor(
  group: PlanGroup,
  months: number | null,
): AvailablePlan {
  if (months === null) return group.variants[0];
  return group.variants.find((v) => monthsOf(v) === months) ?? group.variants[0];
}
