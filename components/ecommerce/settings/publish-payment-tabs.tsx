"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import { copyText } from "@/utils/clipboard";
import { MAX_PAYMENT_METHODS } from "@/types";
import type {
  CheckoutField,
  StorefrontPaymentMethodDef,
  StorefrontSettings,
} from "@/types";
import { StorePublishedDialog } from "@/components/ecommerce/store-published-dialog";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Switch } from "@/ui/components/switch";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { SaveBar, useStoreSettingsSave } from "./settings-form-shared";
import { CustomPaymentMethodEditor } from "./custom-payment-method-editor";
import {
  isMethodOwnedField,
  mergeCheckoutFieldGroup,
  methodOwnerId,
} from "./checkout-custom-fields";

/**
 * The row key for a method the merchant just added.
 *
 * A new row has NO id — the backend mints it from the title on first save — so
 * it cannot key off `method.id` like the others. Only one unsaved row can exist
 * at a time (the merchant has to name it before the tab will save), which is
 * what makes a single shared key safe here.
 */
const NEW_METHOD_ID = "__new";

/** "note + 1 field" — what a collapsed row says it asks the shopper for. */
function describeEntries(fields: CheckoutField[]): string {
  const named = fields.filter((f) => f.label.trim());
  const notes = named.filter((f) => f.kind === "notice").length;
  const inputs = named.filter((f) => f.kind === "input").length;
  const parts: string[] = [];
  if (notes) parts.push(notes === 1 ? "note" : `${notes} notes`);
  if (inputs) parts.push(inputs === 1 ? "1 field" : `${inputs} fields`);
  return parts.join(" + ");
}


export function PublishSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [published, setPublished] = useState(settings.published);
  const [celebrating, setCelebrating] = useState(false);
  const slug = useAuthStore((state) => state.user?.organization?.slug);
  const orgName = useAuthStore((state) => state.user?.organization?.name);
  const hasFavicon = useAuthStore((state) => !!state.user?.organization?.favicon);
  const liveUrl = slug ? storefrontUrl(slug) : null;
  const locationSet = !!settings.storefrontLocationId;
  const copy = async () => {
    if (!liveUrl) return;
    try { await copyText(liveUrl); toast.success("Store URL copied"); }
    catch { toast.error("Couldn't copy the URL"); }
  };
  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Store status</h3><p className="text-xs text-muted-foreground">When live, customers can browse and place orders.</p></div><Switch checked={published} disabled={!locationSet && !published} onCheckedChange={setPublished} /></div>
        {liveUrl ? <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2.5"><span className="text-xs text-muted-foreground">Public URL</span><code className="flex-1 break-all text-xs font-semibold">{liveUrl}</code><Button variant="outline" size="sm" onClick={copy}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</Button><Button variant="outline" size="sm" asChild><a href={liveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Visit</a></Button></div> : null}
        <div className={locationSet ? "rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-200" : "rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200"}>{locationSet ? "✓ Fulfillment location is set — you're ready to publish." : "Set a fulfillment location (General tab) before publishing."}</div>
        {!hasFavicon ? <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">No browser tab icon set — your shop will show the EzyCore icon. Add one under Settings → Organization.</div> : null}
      </Card>
      <SaveBar pending={pending} onSave={() => save({ published }, () => { if (published && !settings.published && liveUrl) setCelebrating(true); })} />
      {liveUrl ? <StorePublishedDialog open={celebrating} onOpenChange={setCelebrating} url={liveUrl} storeName={settings.displayName || orgName} /> : null}
    </div>
  );
}

const COMING_SOON = ["Online gateway", "Card"];

/**
 * Give every ENABLED method a definition, inventing one where it is missing.
 *
 * ⚠ This is not defensive padding — without it this tab silently deletes a live
 * payment method. A store that predates merchant-defined methods carries
 * `allowedPaymentMethods: ["cod", "bank"]` with an empty `paymentMethods`, so the
 * editor would render no rows, and the save — which rebuilds the allow-list from
 * the rows it has — would write `["cod"]` and drop bank from the checkout.
 *
 * The backfill migration writes these definitions, but relying on it would make
 * this tab correct only AFTER a migration had run: a merchant who opened Payments
 * in the window between deploy and `migrate:up` would lose a payment method.
 * Synthesizing here removes that ordering dependency entirely — the migration
 * becomes a tidy-up rather than a prerequisite — and a save persists what it made
 * up, so it converges on the same state either way.
 */
const SYNTHESIZED_TITLES: Record<string, string> = {
  // Matches the migration exactly, so it does not matter which ran first.
  bank: "Bank Transfer",
};

export function withSynthesizedDefinitions(
  defined: StorefrontPaymentMethodDef[],
  allowed: string[],
): StorefrontPaymentMethodDef[] {
  const have = new Set(defined.map((m) => m.id).filter(Boolean));
  const missing = allowed.filter(
    // `cod` is the platform's and never has a definition; `manual` is the admin
    // path's id and is not supposed to be shopper-facing at all.
    (id) => id !== "cod" && id !== "manual" && !have.has(id),
  );
  return [
    ...defined,
    ...missing.map((id) => ({
      id,
      // An id the merchant can rename, rather than a blank row they must name
      // before the tab will save at all.
      title: SYNTHESIZED_TITLES[id] ?? id,
    })),
  ];
}

/**
 * Payment methods — the merchant's own list.
 *
 * Only `cod` is ours, because "you pay on delivery" is the one promise the
 * platform can make on every store's behalf. Everything else is merchant data:
 * bKash, Nagad, a bank account, "pay at our shop". None of them talk to a
 * gateway; they exist so the merchant can state how to pay and what to send back.
 *
 * Two things live here that look like they belong elsewhere, and both are
 * deliberate:
 *
 * 1. **Each method's note and fields.** They are ordinary `checkout.customFields`
 *    locked to that method's id, so they reuse one renderer, one required-field
 *    validator and one order snapshot instead of growing a second field system.
 *    Editing them beside the title they belong to is the only arrangement a
 *    merchant can actually follow.
 * 2. **A save writes `checkout.customFields` as well as the payment settings.**
 *    That array is shared with the Checkout tab and the PATCH replaces it
 *    wholesale, so this save has to carry the Checkout tab's entries through
 *    untouched — which is what `mergeCheckoutFieldGroup` is for.
 */
export function PaymentsSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const storedFields = settings.checkout?.customFields ?? [];

  // The same permission-appropriate hook the order money dialogs use: it asks
  // the minimal multi-domain endpoint, so a role with `storefront.orders.manage`
  // but not `accounts.view` still gets a usable picker instead of an empty one.
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();
  const [accountMap, setAccountMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [method, id] of Object.entries(settings.paymentAccountMap ?? {})) {
      if (id) initial[method] = String(id);
    }
    return initial;
  });

  // ONE row open at a time. That is the whole shape of this tab now: the list is
  // readable at a glance and the detail is somewhere you go, not something you
  // scroll past three times on the way to the method you wanted.
  const [openId, setOpenId] = useState<string | null>(null);

  const [codEnabled, setCodEnabled] = useState(
    (settings.allowedPaymentMethods ?? ["cod"]).includes("cod"),
  );
  const [methods, setMethods] = useState<StorefrontPaymentMethodDef[]>(() =>
    withSynthesizedDefinitions(
      settings.paymentMethods ?? [],
      settings.allowedPaymentMethods ?? [],
    ),
  );
  // Which defined methods are actually offered. Held apart from the list itself
  // so a merchant can take one off the checkout for a week without losing its
  // wording and its instructions.
  const [enabled, setEnabled] = useState<string[]>(
    (settings.allowedPaymentMethods ?? ["cod"]).filter((id) => id !== "cod"),
  );
  // Keyed by method id, `cod` included — it is a row like any other now, so it
  // can carry instructions ("have the exact amount ready") that it never could
  // as a checkbox in its own block.
  const [fieldsByMethod, setFieldsByMethod] = useState<Record<string, CheckoutField[]>>(
    () => {
      const initial: Record<string, CheckoutField[]> = { cod: [] };
      for (const method of settings.paymentMethods ?? []) {
        if (!method.id) continue;
        initial[method.id] = [];
      }
      for (const field of storedFields) {
        const owner = methodOwnerId(field);
        if (!owner) continue;
        (initial[owner] ??= []).push(field);
      }
      return initial;
    },
  );


  /**
   * ⚠ Adopt the server's answer after a save, or a new row stays "unsaved".
   *
   * The backend mints a method's id from its title on first save, and every
   * piece of state above was seeded by a `useState` initializer that does not
   * re-run. So a merchant who added bKash and saved would keep looking at a row
   * with no id — still showing "save to add the payment instructions", with no
   * route to the field editor short of leaving the tab and coming back.
   *
   * Render-time adjust rather than an effect: the same pattern `use-checkout`
   * uses for its profile prefill, and it avoids painting once with stale ids.
   * `fieldsByMethod` and `accountMap` are deliberately NOT reset — their keys are
   * ids that never change, and the save echoed back what we already hold.
   */
  const storedSignature = JSON.stringify(settings.paymentMethods ?? []);
  const [syncedFrom, setSyncedFrom] = useState(storedSignature);
  if (syncedFrom !== storedSignature) {
    setSyncedFrom(storedSignature);
    const fresh = withSynthesizedDefinitions(
      settings.paymentMethods ?? [],
      settings.allowedPaymentMethods ?? [],
    );
    setMethods(fresh);
    setCodEnabled((settings.allowedPaymentMethods ?? ["cod"]).includes("cod"));
    setEnabled((settings.allowedPaymentMethods ?? ["cod"]).filter((id) => id !== "cod"));
    // A row that was open as "new" reopens under the id it was just given, so
    // the merchant lands on its instructions instead of a collapsed list.
    if (openId === NEW_METHOD_ID) setOpenId(fresh[fresh.length - 1]?.id ?? null);
  }
  const sharedFields = storedFields.filter((f) => !isMethodOwnedField(f));
  // Entries conditioned on a method this store no longer defines. Nothing can
  // edit them and the storefront never renders them (the condition cannot match),
  // but they are the merchant's words, so a save carries them through rather than
  // deleting data no one asked to delete.
  const rowIds = new Set(["cod", ...methods.map((m) => m.id).filter(Boolean)]);
  const orphanFields = storedFields.filter(
    (f) => isMethodOwnedField(f) && !rowIds.has(methodOwnerId(f) ?? ""),
  );
  const ownedCount = Object.values(fieldsByMethod).reduce(
    (n, list) => n + list.filter((f) => f.label.trim()).length,
    0,
  );

  const updateMethod = (index: number, next: StorefrontPaymentMethodDef) =>
    setMethods((current) => current.map((m, i) => (i === index ? next : m)));

  const moveMethod = (index: number, delta: number) =>
    setMethods((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeMethod = (index: number) => {
    const method = methods[index];
    setMethods((current) => current.filter((_, i) => i !== index));
    if (!method.id) return;
    // Its notes and fields go with it: they name an id nothing will offer again,
    // and a condition naming a missing method would hide them forever anyway.
    setEnabled((current) => current.filter((id) => id !== method.id));
    setFieldsByMethod((current) => {
      const next = { ...current };
      delete next[method.id!];
      return next;
    });
    if (openId === method.id) setOpenId(null);
  };

  const addMethod = () => {
    setMethods((current) => [...current, { title: "", subtitle: undefined }]);
    // A row the merchant just asked for opens itself; finding it collapsed and
    // unnamed at the bottom of the list would be a puzzle, not a list.
    setOpenId(NEW_METHOD_ID);
  };

  /** The collapsed row's recap: where the money goes, and what it asks for. */
  const summaryFor = (id: string | undefined, builtIn: boolean) => {
    const accountLabel = id
      ? accountOptions.find((o) => o.value === accountMap[id])?.label
      : undefined;
    const parts = [
      accountsEnabled && accountOptions.length
        ? (accountLabel ?? "Ask each time")
        : null,
      builtIn ? "built in" : null,
      describeEntries(id ? (fieldsByMethod[id] ?? []) : []),
    ].filter(Boolean);
    return parts.join(" · ");
  };

  const savePayments = () => {
    const cleaned = methods
      .map((m) => ({
        ...m,
        title: m.title.trim(),
        subtitle: m.subtitle?.trim() || undefined,
      }))
      .filter((m) => m.title);

    if (methods.length !== cleaned.length) {
      // Dropping them silently would delete a row the merchant is mid-way
      // through typing, so this asks rather than guesses.
      toast.error("Give every payment method a title, or remove it");
      return;
    }

    const allowed = [
      ...(codEnabled ? ["cod"] : []),
      ...cleaned
        .map((m) => m.id)
        .filter((id): id is string => !!id && enabled.includes(id)),
    ];
    if (!allowed.length) {
      // The backend refuses an empty list too; catching it here says WHY.
      toast.error("Offer at least one payment method at checkout");
      return;
    }

    // Rebuild the shared array: every row's own entries — `cod` included, since
    // it owns fields now — plus the orphans, with everything the Checkout tab
    // owns put back exactly where it was.
    const owned = [
      ...["cod", ...cleaned.map((m) => m.id)].flatMap((id) =>
        (id ? (fieldsByMethod[id] ?? []) : []).filter((f) => f.label.trim()),
      ),
      ...orphanFields,
    ];
    const customFields = mergeCheckoutFieldGroup(storedFields, owned, isMethodOwnedField);

    const storedMap = settings.paymentAccountMap ?? {};
    const accountUpdates: Record<string, string | null> = {};
    for (const [method, id] of Object.entries(accountMap)) {
      const before = storedMap[method] ? String(storedMap[method]) : "";
      if (id === before) continue;
      accountUpdates[method] = id || null;
    }
    // A deleted method's mapping goes with it, or the map accumulates pointers
    // to methods nothing will ever offer again.
    const liveIds = new Set(allowed.concat(cleaned.map((m) => m.id ?? "")));
    for (const [method, id] of Object.entries(storedMap)) {
      if (id && !liveIds.has(method)) accountUpdates[method] = null;
    }

    save({
      allowedPaymentMethods: allowed,
      paymentMethods: cleaned,
      checkout: { ...(settings.checkout ?? {}), customFields },
      ...(Object.keys(accountUpdates).length
        ? { paymentAccountMap: accountUpdates }
        : {}),
    });
  };

  const pickerOptions = accountsEnabled && accountOptions.length ? accountOptions : undefined;
  const budgetFor = (id: string | undefined) =>
    sharedFields.length +
    orphanFields.length +
    ownedCount -
    (id ? (fieldsByMethod[id] ?? []).filter((f) => f.label.trim()).length : 0);

  return (
    <div className="space-y-5">
      {/* ONE card. The shipped design nested three levels of them. */}
      <Card className="gap-0 p-0 shadow-none">
        <div className="flex flex-col gap-3 px-4 pt-4 pb-3 md:flex-row md:items-start md:gap-4 md:px-5 md:pt-5">
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Payment methods</h3>
            <p className="text-xs text-muted-foreground">
              How shoppers can pay at checkout, in the order they see them.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full md:h-8 md:w-auto"
            disabled={methods.length >= MAX_PAYMENT_METHODS}
            onClick={addMethod}
          >
            <Plus className="size-4" /> Add method
          </Button>
        </div>

        {/* Cash on Delivery is a row in the same list, not a checkbox above it. */}
        <CustomPaymentMethodEditor
          method={{ id: "cod", title: "Cash on Delivery", subtitle: "the shopper pays the rider" }}
          builtIn
          enabled={codEnabled}
          open={openId === "cod"}
          summary={summaryFor("cod", true)}
          fields={fieldsByMethod.cod ?? []}
          reservedFieldCount={budgetFor("cod")}
          canMoveUp={false}
          canMoveDown={false}
          accountOptions={pickerOptions}
          accountId={accountMap.cod}
          onToggleOpen={() => setOpenId(openId === "cod" ? null : "cod")}
          onAccountChange={(id) => setAccountMap((current) => ({ ...current, cod: id }))}
          onMethodChange={() => {}}
          onEnabledChange={setCodEnabled}
          onFieldsChange={(next) =>
            setFieldsByMethod((current) => ({ ...current, cod: next }))
          }
          onMove={() => {}}
          onRemove={() => {}}
        />

        {methods.map((method, index) => {
          const rowId = method.id ?? NEW_METHOD_ID;
          return (
            <CustomPaymentMethodEditor
              key={rowId}
              method={method}
              enabled={!method.id || enabled.includes(method.id)}
              open={openId === rowId}
              summary={summaryFor(method.id, false)}
              fields={method.id ? (fieldsByMethod[method.id] ?? []) : []}
              reservedFieldCount={budgetFor(method.id)}
              canMoveUp={index > 0}
              canMoveDown={index < methods.length - 1}
              accountOptions={pickerOptions}
              accountId={method.id ? accountMap[method.id] : undefined}
              onToggleOpen={() => setOpenId(openId === rowId ? null : rowId)}
              onAccountChange={(id) => {
                if (!method.id) return;
                setAccountMap((current) => ({ ...current, [method.id!]: id }));
              }}
              onMethodChange={(next) => updateMethod(index, next)}
              onEnabledChange={(on) => {
                if (!method.id) return;
                setEnabled((current) =>
                  on
                    ? Array.from(new Set([...current, method.id!]))
                    : current.filter((id) => id !== method.id),
                );
              }}
              onFieldsChange={(next) => {
                if (!method.id) return;
                setFieldsByMethod((current) => ({ ...current, [method.id!]: next }));
              }}
              onMove={(delta) => moveMethod(index, delta)}
              onRemove={() => removeMethod(index)}
            />
          );
        })}

        {/* Was five stacked disabled checkboxes. One line says the same thing. */}
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground md:px-5">
          <span>{COMING_SOON.join(" and ").toLowerCase()} payments</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            Coming soon
          </span>
        </div>
      </Card>
      <SaveBar pending={pending} onSave={savePayments} />
    </div>
  );
}
