"use client";
// coding-standard: maintained

import { useState } from "react";
import { useContentPages } from "@/services/api";
import type { StorefrontSettings } from "@/types";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Field, SaveBar, ToggleRow, useStoreSettingsSave } from "./settings-form-shared";

const ADDRESS_FIELDS = [
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone" },
  { id: "address", label: "Address" },
  { id: "area", label: "Area / zone" },
];
const LOCKED_FIELDS = ["name", "phone"];
const AUTO_TERMS = "__auto";

export function CheckoutSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const checkout = settings.checkout ?? {};
  const [fields, setFields] = useState(() => Array.from(new Set([...LOCKED_FIELDS, ...(checkout.requiredFields ?? ["name", "phone", "address"])])));
  const [minOrder, setMinOrder] = useState<number | null>(checkout.minOrderValue ?? null);
  const [prefix, setPrefix] = useState(checkout.orderPrefix ?? "");
  const [terms, setTerms] = useState(checkout.termsRequired ?? false);
  const [termsPage, setTermsPage] = useState(checkout.termsPageSlug || AUTO_TERMS);
  const { data: pages } = useContentPages();
  const pageOptions = [
    { label: "Auto-detect (a published page slugged “terms”)", value: AUTO_TERMS },
    ...(pages ?? []).filter((page) => page.published).map((page) => ({ label: page.title, value: page.slug })),
  ];
  const toggleField = (id: string, on: boolean) => setFields((current) => on ? Array.from(new Set([...current, id])) : current.filter((field) => field !== id));

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <ToggleRow label="Require terms acceptance" desc="Shopper must accept terms before placing an order." checked={terms} onChange={setTerms} />
        {terms ? <div className="space-y-1.5"><Label>Terms page</Label><SimpleSelect value={termsPage} onValueChange={setTermsPage} options={pageOptions} className="max-w-sm" /><p className="text-xs text-muted-foreground">Manage pages under Content. Auto-detect uses a published page slugged like terms.</p></div> : null}
        <div className="space-y-2">
          <Label>Required checkout fields</Label>
          <div className="flex flex-wrap gap-4">
            {ADDRESS_FIELDS.map((field) => {
              const locked = LOCKED_FIELDS.includes(field.id);
              return <label key={field.id} className={cn("flex items-center gap-2 text-sm", locked && "text-muted-foreground")}><Checkbox checked={locked || fields.includes(field.id)} disabled={locked} onCheckedChange={(value) => toggleField(field.id, value === true)} />{field.label}</label>;
            })}
          </div>
          <p className="text-xs text-muted-foreground">Name and phone are always required. Pickup orders only need those two fields.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum order value"><NumberField min={0} precision={2} value={minOrder} onChange={setMinOrder} placeholder="0" /></Field>
          <Field label="Order number prefix"><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. RM-" maxLength={12} /></Field>
        </div>
      </Card>
      <SaveBar pending={pending} onSave={() => save({ checkout: {
        termsRequired: terms,
        requiredFields: fields,
        minOrderValue: minOrder ?? undefined,
        orderPrefix: prefix.trim() || undefined,
        termsPageSlug: termsPage === AUTO_TERMS ? undefined : termsPage,
      } })} />
    </div>
  );
}
