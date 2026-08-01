"use client";
// coding-standard: maintained

import Link from "next/link";
import { Card } from "@/ui/components/card";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";

/**
 * Abandoned-cart recovery settings (backend `docs/plan/abandoned-cart.md`,
 * Phase 3). Presentational — the owning tab holds the state and includes
 * `delaysMinutes` in its own save, so this adds nothing to that page's size.
 *
 * **Presets, not a free-form array.** The stored shape is `number[]`, but a
 * merchant choosing "1 hour / then 24 hours" is making a marketing decision, not
 * editing a schedule; exposing the array would invite orderings the sweep has to
 * defend against for no benefit. The two selects always produce a sorted,
 * validly-capped array.
 */
interface CartRecoveryCardProps {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  /** Sorted ascending; length is the send cap. */
  delaysMinutes: number[];
  onDelaysChange: (value: number[]) => void;
}

const FIRST_OPTIONS = [
  { label: "1 hour after they leave", value: "60" },
  { label: "4 hours after they leave", value: "240" },
  { label: "24 hours after they leave", value: "1440" },
];

const SECOND_OPTIONS = [
  { label: "Don't send a second one", value: "0" },
  { label: "24 hours after they leave", value: "1440" },
  { label: "3 days after they leave", value: "4320" },
];

export function CartRecoveryCard({
  enabled,
  onEnabledChange,
  delaysMinutes,
  onDelaysChange,
}: CartRecoveryCardProps) {
  const first = String(delaysMinutes[0] ?? 60);
  const second = String(delaysMinutes[1] ?? 0);

  const commit = (nextFirst: string, nextSecond: string) => {
    const a = Number(nextFirst);
    const b = Number(nextSecond);
    // A second reminder must land after the first, or the sweep would send both
    // on the same pass — the select can't express that, so it is enforced here.
    onDelaysChange(b > a ? [a, b] : [a]);
  };

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <label className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium">
            Email shoppers who leave items behind
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Sends a reminder with a one-click link back to their cart. Only goes to
            shoppers who signed in and have not turned off promotional email —
            guests cannot be contacted.
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </label>

      {enabled ? (
        <div className="grid gap-4 pt-1 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>First reminder</Label>
            <SimpleSelect
              value={first}
              onValueChange={(v) => commit(v, second)}
              options={FIRST_OPTIONS}
            />
            <p className="text-xs text-muted-foreground">
              Sooner converts better — most stores see the best result within a few
              hours.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Second reminder</Label>
            <SimpleSelect
              value={second}
              onValueChange={(v) => commit(first, v)}
              options={SECOND_OPTIONS}
            />
            <p className="text-xs text-muted-foreground">
              Two is the maximum. More than that reads as spam and costs you the
              subscriber.
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Check{" "}
        <Link href="/ecommerce/carts" className="underline underline-offset-2">
          Abandoned Carts
        </Link>{" "}
        first — if most of your carts never reach sign-in, these emails cannot
        reach them and the funnel is the thing to fix.
      </p>
    </Card>
  );
}
