"use client";
// coding-standard: maintained

import type { CartFunnelStats } from "@/services/api";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * The purchase funnel — how many carts reached each step, and where they were lost.
 *
 * **Form:** magnitude comparison across five ordered stages of ONE measure, so it is
 * a sequential bar chart, not a categorical one — every bar wears the same hue and
 * length alone carries magnitude (a colour ramp here would double-encode what the
 * bar already says). Single series ⇒ no legend; the heading names what is plotted.
 * Colour comes from `--chart-3`, the repo's monochrome cyan chart ramp, which
 * `globals.css` explicitly reserves for series that carry no good/bad meaning —
 * status colours would wrongly moralise a funnel step.
 *
 * **Steps 3 and 4 are ours alone.** No other platform's funnel has "signed in" and
 * "email verified", because no other platform puts an account wall and a
 * verification wall in front of its checkout. The drop between them is the number
 * the whole feature exists to expose.
 */
interface CartFunnelProps {
  data?: CartFunnelStats;
  isLoading?: boolean;
}

interface FunnelStep {
  key: string;
  label: string;
  hint: string;
  value: number;
}

/** Bars cap at 24px (mark spec) and round only at the data end. */
const BAR_HEIGHT = "h-5";

export function CartFunnel({ data, isLoading }: CartFunnelProps) {
  if (isLoading || !data) {
    return (
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const f = data.funnel;
  const steps: FunnelStep[] = [
    { key: "carts", label: "Built a cart", hint: "Added at least one item", value: f.carts },
    {
      key: "checkout",
      label: "Reached checkout",
      hint: "Opened the checkout page",
      value: f.reachedCheckout,
    },
    {
      key: "signedIn",
      label: "Signed in",
      hint: "Your store requires an account to order",
      value: f.signedIn,
    },
    {
      key: "verified",
      label: "Email verified",
      hint: "Unverified shoppers cannot place an order",
      value: f.verified,
    },
    { key: "ordered", label: "Ordered", hint: "Became a real order", value: f.ordered },
  ];

  const top = steps[0].value;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Purchase funnel</h2>
        <span className="text-xs text-muted-foreground">
          Carts started in the last {data.windowDays} days
        </span>
      </div>

      {top === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No carts yet. Once shoppers start adding items, this shows where you lose
          them.
        </p>
      ) : (
        <ol className="mt-5 space-y-3">
          {steps.map((step, i) => {
            const prev = i === 0 ? null : steps[i - 1].value;
            // Drop-off is measured against the PREVIOUS step, not the top: the
            // merchant's question is "which wall lost them", and a share-of-total
            // reading hides a brutal single step behind a healthy overall number.
            const lost = prev === null ? 0 : prev - step.value;
            const lostPct = prev && prev > 0 ? lost / prev : 0;

            return (
              <li key={step.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{step.label}</span>
                  {/* Values are ink, never the series colour (a chart hue is
                      illegible as text); the bar beside them carries identity. */}
                  <span className="tabular-nums font-semibold">
                    {step.value.toLocaleString()}
                  </span>
                </div>

                <div
                  className="mt-1.5 w-full overflow-hidden rounded-sm bg-muted"
                  title={`${step.label} — ${step.value.toLocaleString()} of ${top.toLocaleString()} carts (${pct(
                    top > 0 ? step.value / top : 0,
                  )})`}
                >
                  <div
                    className={`${BAR_HEIGHT} rounded-r-[4px] bg-[var(--chart-3)]`}
                    style={{ width: `${Math.max(top > 0 ? (step.value / top) * 100 : 0, step.value > 0 ? 1.5 : 0)}%` }}
                  />
                </div>

                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
                  <span>{step.hint}</span>
                  {prev !== null && lost > 0 ? (
                    <span>
                      −{lost.toLocaleString()} lost here ({pct(lostPct)})
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;
