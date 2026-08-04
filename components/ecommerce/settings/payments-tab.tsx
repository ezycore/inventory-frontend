"use client";
// coding-standard: maintained

import { useState } from "react";
import type { StorefrontPaymentMethod, StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { Textarea } from "@/ui/components/textarea";
import { SaveBar, useSave } from "./settings-primitives";

/** Gateways that are not integrated yet — shown disabled so the roadmap is visible. */
const COMING_SOON = ["bKash", "Nagad", "Card"];

/** Store Settings → Payments: which methods checkout offers. */
export function PaymentsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [methods, setMethods] = useState<StorefrontPaymentMethod[]>(
    settings.allowedPaymentMethods ?? ["cod"],
  );
  const [bankInstructions, setBankInstructions] = useState(
    settings.bankInstructions ?? "",
  );

  const toggle = (m: StorefrontPaymentMethod, on: boolean) =>
    setMethods((prev) =>
      on ? Array.from(new Set([...prev, m])) : prev.filter((x) => x !== m),
    );

  return (
    <div className="space-y-5">
      <Card className="space-y-2 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Payment methods</h3>
          <p className="text-xs text-muted-foreground">
            How shoppers can pay at checkout. Cash on Delivery is the default for
            the Bangladesh market.
          </p>
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={methods.includes("cod")}
            onCheckedChange={(c) => toggle("cod", c === true)}
          />
          Cash on Delivery
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            Default
          </span>
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={methods.includes("bank")}
            onCheckedChange={(c) => toggle("bank", c === true)}
          />
          Bank / Manual transfer
        </label>
        {methods.includes("bank") && (
          <Textarea
            value={bankInstructions}
            onChange={(e) => setBankInstructions(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Bank transfer instructions shown to customers at checkout…"
            className="w-full"
          />
        )}
        <div className="space-y-2 border-t pt-3">
          {COMING_SOON.map((p) => (
            <label
              key={p}
              className="flex cursor-not-allowed items-center gap-2.5 text-sm text-muted-foreground"
            >
              <Checkbox disabled />
              {p}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                Coming soon
              </span>
            </label>
          ))}
        </div>
      </Card>
      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            // Never save an empty list — a store with no payment method cannot
            // take an order, so COD is the floor.
            allowedPaymentMethods: methods.length ? methods : ["cod"],
            bankInstructions: bankInstructions.trim() || undefined,
          })
        }
      />
    </div>
  );
}
