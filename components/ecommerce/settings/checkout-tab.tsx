"use client";
// coding-standard: maintained

import { useState } from "react";
import { useContentPages } from "@/services/api";
import type { StorefrontSettings } from "@/types";
import { CartRecoveryCard } from "@/components/ecommerce/carts/cart-recovery-card";
import { Card } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@/ui/lib/utils";
import {
  Field,
  SaveBar,
  ToggleRow,
  useSave,
  type Option,
} from "./settings-primitives";

const ADDRESS_FIELDS = [
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone" },
  { id: "address", label: "Address" },
  { id: "area", label: "Area / zone" },
];
// Name + phone are always needed to fulfil an order, so they can't be turned off.
// (Area is also forced when Dhaka zone shipping is on — it prices the order.)
const LOCKED_FIELDS = ["name", "phone"];
// Sentinel for "no explicit terms page" — the checkout then auto-detects a page
// slugged like "terms" (Radix Select forbids an empty-string item value).
const AUTO_TERMS = "__auto";

/**
 * Store Settings → Checkout: terms, required address fields, order rules, and
 * abandoned-cart recovery.
 */
export function CheckoutTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const c = settings.checkout ?? {};
  const [fields, setFields] = useState<string[]>(() =>
    Array.from(
      new Set([...LOCKED_FIELDS, ...(c.requiredFields ?? ["name", "phone", "address"])]),
    ),
  );
  const [minOrder, setMinOrder] = useState<number | null>(
    c.minOrderValue ?? null,
  );
  const [prefix, setPrefix] = useState(c.orderPrefix ?? "");
  const [terms, setTerms] = useState(c.termsRequired ?? false);
  const [termsPage, setTermsPage] = useState(c.termsPageSlug || AUTO_TERMS);
  // Abandoned-cart recovery (docs/plan/abandoned-cart.md). Off unless opted in.
  const recovery = settings.cartRecovery ?? {};
  const [recoveryOn, setRecoveryOn] = useState(recovery.enabled ?? false);
  const [recoveryDelays, setRecoveryDelays] = useState<number[]>(
    recovery.delaysMinutes?.length ? recovery.delaysMinutes : [60],
  );

  const { data: pages } = useContentPages();
  const termsPageOptions: Option[] = [
    { label: "Auto-detect (a published page slugged “terms”)", value: AUTO_TERMS },
    ...(pages ?? [])
      .filter((p) => p.published)
      .map((p) => ({ label: p.title, value: p.slug })),
  ];

  const toggleField = (id: string, on: boolean) =>
    setFields((prev) =>
      on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id),
    );

  return (
    <div className="space-y-5">
      <Card className="space-y-1 p-5 shadow-none">
        <ToggleRow
          label="Require terms acceptance"
          desc="Shopper must accept terms before placing an order."
          checked={terms}
          onChange={setTerms}
        />
        {terms ? (
          <div className="space-y-1.5 pt-1">
            <Label>Terms page</Label>
            <SimpleSelect
              value={termsPage}
              onValueChange={setTermsPage}
              options={termsPageOptions}
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">
              Where the terms link goes at checkout. Manage pages under Content —
              Auto-detect uses a published page slugged like terms.
            </p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Required checkout fields</Label>
          <div className="flex flex-wrap gap-4">
            {ADDRESS_FIELDS.map((f) => {
              const locked = LOCKED_FIELDS.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    locked && "text-muted-foreground",
                  )}
                >
                  <Checkbox
                    checked={locked || fields.includes(f.id)}
                    disabled={locked}
                    onCheckedChange={(v) => toggleField(f.id, v === true)}
                  />
                  {f.label}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Name and phone are always required. Applies to delivery orders — pickup
            only ever needs name and phone.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum order value">
            <NumberField
              min={0}
              precision={2}
              value={minOrder}
              onChange={setMinOrder}
              placeholder="0"
            />
          </Field>
          <Field label="Order number prefix">
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. RM-"
              maxLength={12}
            />
          </Field>
        </div>
      </Card>
      <CartRecoveryCard
        enabled={recoveryOn}
        onEnabledChange={setRecoveryOn}
        delaysMinutes={recoveryDelays}
        onDelaysChange={setRecoveryDelays}
      />
      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            checkout: {
              termsRequired: terms,
              requiredFields: fields,
              minOrderValue: minOrder ?? undefined,
              orderPrefix: prefix.trim() || undefined,
              termsPageSlug: termsPage === AUTO_TERMS ? undefined : termsPage,
            },
            cartRecovery: {
              enabled: recoveryOn,
              delaysMinutes: recoveryDelays,
            },
          })
        }
      />
    </div>
  );
}
