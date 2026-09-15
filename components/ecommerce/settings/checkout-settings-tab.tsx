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
import { Textarea } from "@/ui/components/textarea";
import {
  CheckoutCustomFields,
  isMethodOwnedField,
  mergeCheckoutFieldGroup,
} from "./checkout-custom-fields";
import { Field, SaveBar, ToggleRow, useStoreSettingsSave } from "./settings-form-shared";

const ADDRESS_FIELDS = [
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone" },
  { id: "address", label: "Address" },
  { id: "area", label: "Area / zone" },
];
const LOCKED_FIELDS = ["name", "phone"];
const AUTO_TERMS = "__auto";

const ADDRESS_MODES = [
  { label: "Street, district and area (recommended)", value: "detailed" },
  { label: "One address box", value: "flat" },
];

export function CheckoutSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const checkout = settings.checkout ?? {};
  const [fields, setFields] = useState(() => Array.from(new Set([...LOCKED_FIELDS, ...(checkout.requiredFields ?? ["name", "phone", "address"])])));
  const [minOrder, setMinOrder] = useState<number | null>(checkout.minOrderValue ?? null);
  const [prefix, setPrefix] = useState(checkout.orderPrefix ?? "");
  const [terms, setTerms] = useState(checkout.termsRequired ?? false);
  const [termsPage, setTermsPage] = useState(checkout.termsPageSlug || AUTO_TERMS);
  const [addressMode, setAddressMode] = useState(checkout.addressMode ?? "detailed");
  // Unset reads as ON — every store that predates the toggle was showing it.
  const [orderNotes, setOrderNotes] = useState(checkout.showOrderNotes !== false);
  const [ordersPaused, setOrdersPaused] = useState(checkout.ordersPaused ?? false);
  const [pausedMessage, setPausedMessage] = useState(checkout.pausedMessage ?? "");
  const [pausedWhatsApp, setPausedWhatsApp] = useState(checkout.pausedWhatsApp ?? false);
  // The message replaces every buy button, and the shop has no wording of its own
  // for it — the backend refuses a pause without one (ORDERS_PAUSED_MESSAGE_REQUIRED).
  const missingPauseMessage = ordersPaused && !pausedMessage.trim();
  // This editor holds the entries asked on EVERY order. Anything tied to a
  // payment method is edited on the Payments tab, beside the method it belongs
  // to — filtered out here so no entry is ever presented in two places, and put
  // back untouched on save, because this PATCH replaces the array wholesale.
  const storedFields = checkout.customFields ?? [];
  const methodOwnedFields = storedFields.filter(isMethodOwnedField);
  const [customFields, setCustomFields] = useState(() =>
    storedFields.filter((field) => !isMethodOwnedField(field)),
  );
  const { data: pages } = useContentPages();
  const pageOptions = [
    { label: "Auto-detect (a published page slugged “terms”)", value: AUTO_TERMS },
    ...(pages ?? []).filter((page) => page.published).map((page) => ({ label: page.title, value: page.slug })),
  ];
  const toggleField = (id: string, on: boolean) => setFields((current) => on ? Array.from(new Set([...current, id])) : current.filter((field) => field !== id));

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <ToggleRow
          label="Pause online orders"
          desc="Shoppers can still browse your store but cannot place an order. Orders you create yourself are not affected."
          checked={ordersPaused}
          onChange={setOrdersPaused}
        />
        {ordersPaused ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="orders-paused-message">Message to shoppers</Label>
              <Textarea
                id="orders-paused-message"
                value={pausedMessage}
                onChange={(event) => setPausedMessage(event.target.value)}
                maxLength={300}
                rows={3}
                placeholder="We're closed for Eid until 20 April. Message us on WhatsApp to order."
              />
              <p className={cn("text-xs", missingPauseMessage ? "text-destructive" : "text-muted-foreground")}>
                {missingPauseMessage
                  ? "Write a message before saving — it replaces every Buy button."
                  : "Shown instead of every Buy button, the cart's checkout button and the checkout page, exactly as you write it."}
              </p>
            </div>
            <ToggleRow
              label="Offer Order on WhatsApp"
              desc="Adds a WhatsApp chat button under your message, using your contact button's WhatsApp number."
              checked={pausedWhatsApp}
              onChange={setPausedWhatsApp}
            />
          </>
        ) : null}
      </Card>
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
        <div className="space-y-1.5">
          <Label>Address format</Label>
          <SimpleSelect
            value={addressMode}
            onValueChange={(value) => setAddressMode(value as "detailed" | "flat")}
            options={ADDRESS_MODES}
            className="max-w-sm"
          />
          {/* The trade-off is real and worth stating plainly here: with one box
              the district is read from the text, and an address it cannot place
              makes the shopper answer an Inside/Outside question instead. That
              is still one tap, and it is the only alternative to charging a
              guessed rate. */}
          <p className="text-xs text-muted-foreground">
            {addressMode === "flat"
              ? "Shoppers type one address. The delivery zone is read from what they write; if it cannot be determined, they are asked to pick inside or outside Dhaka."
              : "Shoppers pick a district from a list, so the delivery zone is exact."}
          </p>
        </div>
        <ToggleRow
          label="Ask for delivery notes"
          desc="A free-text box under the address. What shoppers write goes to the courier with the parcel — a gate code, a landmark, “call before you come”."
          checked={orderNotes}
          onChange={setOrderNotes}
        />
        <CheckoutCustomFields
          fields={customFields}
          onChange={setCustomFields}
          reservedFieldCount={methodOwnedFields.length}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum order value"><NumberField min={0} precision={2} value={minOrder} onChange={setMinOrder} placeholder="0" /></Field>
          <Field label="Order number prefix"><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. RM-" maxLength={12} /></Field>
        </div>
      </Card>
      <SaveBar pending={pending} onSave={() => !missingPauseMessage && save({ checkout: {
        ordersPaused,
        pausedMessage: pausedMessage.trim() || undefined,
        pausedWhatsApp,
        termsRequired: terms,
        requiredFields: fields,
        minOrderValue: minOrder ?? undefined,
        orderPrefix: prefix.trim() || undefined,
        termsPageSlug: termsPage === AUTO_TERMS ? undefined : termsPage,
        addressMode,
        showOrderNotes: orderNotes,
        // Drop entries the merchant started and left blank rather than sending a
        // labelless field the shopper would meet as an unexplained input, then
        // splice the Payments tab's entries back where they were.
        customFields: mergeCheckoutFieldGroup(
          storedFields,
          customFields.filter((field) => field.label.trim()),
          (field) => !isMethodOwnedField(field),
        ),
      } })} />
    </div>
  );
}
