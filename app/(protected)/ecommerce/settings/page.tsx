"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  useGetStorefrontSettings,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { storefrontUrl } from "@/lib/storefront-url";
import type {
  ShippingRuleMode,
  StorefrontPaymentMethod,
  StorefrontSettings,
  UpdateStorefrontSettingsDto,
} from "@/types";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Checkbox } from "@/ui/components/checkbox";
import { Textarea } from "@/ui/components/textarea";
import { Skeleton } from "@/ui/components/skeleton";
import { SimpleSelect } from "@/ui/components/simple-select";
import { CourierSettings } from "@/components/ecommerce/courier-settings";

type Option = { label: string; value: string };

const TABS = [
  { id: "general", label: "General" },
  { id: "templates", label: "Templates" },
  { id: "publish", label: "Publish" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "couriers", label: "Couriers" },
  { id: "checkout", label: "Checkout" },
  { id: "notifications", label: "Notifications" },
  { id: "customers", label: "Customers" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const num = (v: string): number | undefined =>
  v.trim() === "" ? undefined : Number(v);

export default function StoreSettingsPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational configuration for your online store.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading || !settings ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <SettingsTab key={tab} tab={tab} settings={settings} />
      )}
    </div>
  );
}

function SettingsTab({
  tab,
  settings,
}: {
  tab: TabId;
  settings: StorefrontSettings;
}) {
  switch (tab) {
    case "general":
      return <GeneralTab settings={settings} />;
    case "templates":
      return <TemplatesTab settings={settings} />;
    case "publish":
      return <PublishTab settings={settings} />;
    case "payments":
      return <PaymentsTab settings={settings} />;
    case "shipping":
      return <ShippingTab settings={settings} />;
    case "couriers":
      return <CourierSettings />;
    case "checkout":
      return <CheckoutTab settings={settings} />;
    case "notifications":
      return <NotificationsTab settings={settings} />;
    case "customers":
      return <CustomersTab settings={settings} />;
  }
}

/* --------------------------------- shared --------------------------------- */

function SaveBar({
  onSave,
  pending,
}: {
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function useSave() {
  const m = useUpdateStorefrontSettings();
  return {
    save: (dto: UpdateStorefrontSettingsDto) => m.mutate(dto),
    pending: m.isPending,
  };
}

/* -------------------------------- General --------------------------------- */

function GeneralTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [displayName, setDisplayName] = useState(settings.displayName ?? "");
  const [phone, setPhone] = useState(settings.contact?.phone ?? "");
  const [email, setEmail] = useState(settings.contact?.email ?? "");
  const [address, setAddress] = useState(settings.contact?.address ?? "");
  const [locationId, setLocationId] = useState(
    settings.storefrontLocationId ?? "",
  );

  const { data: locationsRes } = useQuery({
    queryKey: ["locations", "storefront-options"],
    queryFn: () =>
      apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(
        "/locations?all=true&fields=_id,name",
      ),
    staleTime: 5 * 60 * 1000,
  });
  const locationOptions: Option[] = (locationsRes?.data?.items ?? []).map((l) => ({
    label: l.name,
    value: l._id,
  }));

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Store details</h3>
          <p className="text-xs text-muted-foreground">
            Basic information about your online store.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your store name"
            />
          </Field>
          <Field label="Currency">
            <Input value={settings.currency ?? ""} disabled />
          </Field>
          <Field label="Contact phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Contact email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Business address">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">
            Fulfillment location <span className="text-red-600">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Which inventory location backs online stock. Required before you can
            publish.
          </p>
        </div>
        <SimpleSelect
          value={locationId}
          onValueChange={setLocationId}
          options={locationOptions}
          placeholder="Select the location that ships online orders"
          className="max-w-sm"
        />
      </Card>

      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            displayName: displayName || undefined,
            storefrontLocationId: locationId || undefined,
            contact: {
              phone: phone || undefined,
              email: email || undefined,
              address: address || undefined,
            },
          })
        }
      />
    </div>
  );
}

/* ------------------------------- Templates -------------------------------- */

const TEMPLATE_PAGES: {
  key: keyof NonNullable<StorefrontSettings["templates"]>;
  label: string;
  desc: string;
  options: Option[];
}[] = [
  {
    key: "home",
    label: "Home page",
    desc: "Landing layout",
    options: [
      { value: "classic", label: "Classic" },
      { value: "hero-split", label: "Hero Split" },
      { value: "minimal", label: "Minimal" },
    ],
  },
  {
    key: "collection",
    label: "Collection page",
    desc: "Category / product listing",
    options: [
      { value: "grid-3", label: "Grid 3-col" },
      { value: "grid-4", label: "Grid 4-col" },
      { value: "sidebar", label: "Sidebar filters" },
    ],
  },
  {
    key: "product",
    label: "Product page",
    desc: "Single product layout",
    options: [
      { value: "gallery-left", label: "Gallery left" },
      { value: "gallery-top", label: "Gallery top" },
      { value: "sticky-bar", label: "Sticky buy bar" },
    ],
  },
  {
    key: "cart",
    label: "Cart",
    desc: "Cart layout",
    options: [
      { value: "two-column", label: "Two column" },
      { value: "drawer", label: "Slide-over drawer" },
    ],
  },
  {
    key: "checkout",
    label: "Checkout",
    desc: "Checkout flow",
    options: [
      { value: "single-page", label: "Single page" },
      { value: "multi-step", label: "Multi-step" },
    ],
  },
  {
    key: "search",
    label: "Search results",
    desc: "Search layout",
    options: [
      { value: "grid", label: "Grid" },
      { value: "list", label: "List" },
    ],
  },
];

function TemplatesTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [tpl, setTpl] = useState<Record<string, string>>(() => {
    const t = settings.templates ?? {};
    const seed: Record<string, string> = {};
    for (const p of TEMPLATE_PAGES) {
      seed[p.key] = (t as Record<string, string>)[p.key] || p.options[0].value;
    }
    return seed;
  });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
        Pick the layout template for each storefront page. Changes apply to your
        live store after saving.
      </div>
      {TEMPLATE_PAGES.map((p) => (
        <Card key={p.key} className="space-y-3 p-5 shadow-none">
          <div>
            <h3 className="text-sm font-semibold">{p.label}</h3>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.options.map((o) => {
              const active = tpl[p.key] === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setTpl((s) => ({ ...s, [p.key]: o.value }))}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:bg-muted/50",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Card>
      ))}
      <SaveBar pending={pending} onSave={() => save({ templates: tpl })} />
    </div>
  );
}

/* -------------------------------- Publish --------------------------------- */

function PublishTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [published, setPublished] = useState(settings.published);
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const liveUrl = slug ? storefrontUrl(slug) : null;
  const locationSet = !!settings.storefrontLocationId;

  const copy = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      toast.success("Store URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Store status</h3>
            <p className="text-xs text-muted-foreground">
              When live, customers can browse and place orders.
            </p>
          </div>
          <Switch
            checked={published}
            disabled={!locationSet && !published}
            onCheckedChange={setPublished}
          />
        </div>

        {liveUrl && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Public URL</span>
            <code className="flex-1 break-all text-xs font-semibold">
              {liveUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Visit
              </a>
            </Button>
          </div>
        )}

        {locationSet ? (
          <div className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800">
            ✓ Fulfillment location is set — you&apos;re ready to publish.
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Set a fulfillment location (General tab) before publishing.
          </div>
        )}
      </Card>
      <SaveBar pending={pending} onSave={() => save({ published })} />
    </div>
  );
}

/* -------------------------------- Payments -------------------------------- */

const COMING_SOON = ["bKash", "Nagad", "Card"];

function PaymentsTab({ settings }: { settings: StorefrontSettings }) {
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
      <Card className="space-y-3 p-5 shadow-none">
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
            className="ml-7"
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
            allowedPaymentMethods: methods.length ? methods : ["cod"],
            bankInstructions: bankInstructions.trim() || undefined,
          })
        }
      />
    </div>
  );
}

/* -------------------------------- Shipping -------------------------------- */

const SHIPPING_MODES: { value: ShippingRuleMode; label: string }[] = [
  { value: "none", label: "No shipping charge" },
  { value: "flat", label: "Flat fee per order" },
  { value: "free_over_threshold", label: "Free over a threshold" },
];

function ShippingTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [mode, setMode] = useState<ShippingRuleMode>(
    settings.shippingRule?.mode ?? "none",
  );
  const [flatFee, setFlatFee] = useState(
    settings.shippingRule?.flatFee?.toString() ?? "",
  );
  const [freeThreshold, setFreeThreshold] = useState(
    settings.shippingRule?.freeThreshold?.toString() ?? "",
  );
  const [defaultDeliveryCost, setDefaultDeliveryCost] = useState(
    settings.defaultDeliveryCost?.toString() ?? "0",
  );
  const [zonesEnabled, setZonesEnabled] = useState(
    settings.shippingZones?.inside != null ||
      settings.shippingZones?.outside != null,
  );
  const [zoneInside, setZoneInside] = useState(
    settings.shippingZones?.inside?.toString() ?? "",
  );
  const [zoneOutside, setZoneOutside] = useState(
    settings.shippingZones?.outside?.toString() ?? "",
  );
  const [zoneFree, setZoneFree] = useState(
    settings.shippingZones?.freeThreshold?.toString() ?? "",
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Shipping &amp; delivery</h3>
        <Field label="Shipping rule">
          <SimpleSelect
            value={mode}
            onValueChange={(v) => setMode(v as ShippingRuleMode)}
            options={SHIPPING_MODES}
          />
        </Field>
        {mode !== "none" && (
          <Field
            label={
              mode === "free_over_threshold" ? "Fee below threshold" : "Flat fee"
            }
          >
            <Input
              type="number"
              min={0}
              value={flatFee}
              onChange={(e) => setFlatFee(e.target.value)}
              placeholder="0"
            />
          </Field>
        )}
        {mode === "free_over_threshold" && (
          <Field label="Free over (order subtotal)">
            <Input
              type="number"
              min={0}
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
              placeholder="0"
            />
          </Field>
        )}
        <Field label="Default courier cost (your expense, editable per order)">
          <Input
            type="number"
            min={0}
            value={defaultDeliveryCost}
            onChange={(e) => setDefaultDeliveryCost(e.target.value)}
            placeholder="0"
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Dhaka delivery zones</h3>
            <p className="text-xs text-muted-foreground">
              Charge inside / outside Dhaka rates. When on, these override the
              shipping rule above and the shopper picks a zone at checkout.
            </p>
          </div>
          <Switch checked={zonesEnabled} onCheckedChange={setZonesEnabled} />
        </div>
        {zonesEnabled && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Inside Dhaka fee">
              <Input
                type="number"
                min={0}
                value={zoneInside}
                onChange={(e) => setZoneInside(e.target.value)}
                placeholder="60"
              />
            </Field>
            <Field label="Outside Dhaka fee">
              <Input
                type="number"
                min={0}
                value={zoneOutside}
                onChange={(e) => setZoneOutside(e.target.value)}
                placeholder="120"
              />
            </Field>
            <Field label="Free over (subtotal)">
              <Input
                type="number"
                min={0}
                value={zoneFree}
                onChange={(e) => setZoneFree(e.target.value)}
                placeholder="2000"
              />
            </Field>
          </div>
        )}
      </Card>

      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            defaultDeliveryCost: num(defaultDeliveryCost) ?? 0,
            shippingRule: {
              mode,
              flatFee: mode === "none" ? undefined : num(flatFee),
              freeThreshold:
                mode === "free_over_threshold" ? num(freeThreshold) : undefined,
            },
            shippingZones: zonesEnabled
              ? {
                  inside: num(zoneInside) ?? 0,
                  outside: num(zoneOutside) ?? 0,
                  freeThreshold: num(zoneFree),
                }
              : undefined,
          })
        }
      />
    </div>
  );
}

/* -------------------------------- Checkout -------------------------------- */

const ADDRESS_FIELDS = [
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone" },
  { id: "address", label: "Address" },
  { id: "area", label: "Area / zone" },
];

function CheckoutTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const c = settings.checkout ?? {};
  const [guest, setGuest] = useState(c.guestCheckout ?? true);
  const [fields, setFields] = useState<string[]>(
    c.requiredFields ?? ["name", "phone", "address"],
  );
  const [minOrder, setMinOrder] = useState(c.minOrderValue?.toString() ?? "");
  const [prefix, setPrefix] = useState(c.orderPrefix ?? "");
  const [terms, setTerms] = useState(c.termsRequired ?? false);

  const toggleField = (id: string, on: boolean) =>
    setFields((prev) =>
      on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id),
    );

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Checkout</h3>
        <ToggleRow
          label="Guest checkout"
          desc="Allow ordering without creating an account."
          checked={guest}
          onChange={setGuest}
        />
        <ToggleRow
          label="Require terms acceptance"
          desc="Shopper must accept terms before placing an order."
          checked={terms}
          onChange={setTerms}
        />
        <div className="space-y-2">
          <Label>Required checkout fields</Label>
          <div className="flex flex-wrap gap-4">
            {ADDRESS_FIELDS.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={fields.includes(f.id)}
                  onCheckedChange={(v) => toggleField(f.id, v === true)}
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum order value">
            <Input
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
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
      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            checkout: {
              guestCheckout: guest,
              termsRequired: terms,
              requiredFields: fields,
              minOrderValue: num(minOrder),
              orderPrefix: prefix.trim() || undefined,
            },
          })
        }
      />
    </div>
  );
}

/* ------------------------------ Notifications ----------------------------- */

const NOTIF_EVENTS: {
  key: "placed" | "confirmed" | "shipped" | "delivered";
  label: string;
  placeholder: string;
}[] = [
  {
    key: "placed",
    label: "Order placed",
    placeholder: "Hi {customer_name}, we received order {order_no}.",
  },
  {
    key: "confirmed",
    label: "Order confirmed",
    placeholder: "Your order {order_no} is confirmed. Total {total}.",
  },
  {
    key: "shipped",
    label: "Order shipped",
    placeholder: "Order {order_no} shipped. Track: {tracking_id}.",
  },
  {
    key: "delivered",
    label: "Order delivered",
    placeholder: "Order {order_no} delivered. Thank you!",
  },
];

function NotificationsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const n = settings.notifications ?? {};
  const [senderId, setSenderId] = useState(n.senderId ?? "");
  const [alertNumber, setAlertNumber] = useState(n.merchantAlertNumber ?? "");
  const [events, setEvents] = useState(() => {
    const seed: Record<string, { enabled: boolean; template: string }> = {};
    for (const e of NOTIF_EVENTS) {
      const ev = n.events?.[e.key];
      seed[e.key] = { enabled: ev?.enabled ?? false, template: ev?.template ?? "" };
    }
    return seed;
  });

  const setEvent = (key: string, patch: Partial<{ enabled: boolean; template: string }>) =>
    setEvents((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">SMS notifications</h3>
          <p className="text-xs text-muted-foreground">
            SMS is the norm in Bangladesh. Use variables{" "}
            <code>{"{order_no}"}</code>, <code>{"{customer_name}"}</code>,{" "}
            <code>{"{tracking_id}"}</code>, <code>{"{total}"}</code> in templates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SMS sender ID / mask">
            <Input
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="e.g. RASHIDMART"
            />
          </Field>
          <Field label="Merchant alert number (new-order pings)">
            <Input
              value={alertNumber}
              onChange={(e) => setAlertNumber(e.target.value)}
              placeholder="+8801…"
            />
          </Field>
        </div>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          The SMS gateway secret/API key is configured separately (encrypted)
          and dispatch is handled server-side.
        </p>
      </Card>

      <Card className="space-y-3 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Events</h3>
        {NOTIF_EVENTS.map((e) => (
          <div key={e.key} className="space-y-2 rounded-lg border p-3">
            <ToggleRow
              label={e.label}
              checked={events[e.key].enabled}
              onChange={(v) => setEvent(e.key, { enabled: v })}
            />
            {events[e.key].enabled && (
              <Textarea
                value={events[e.key].template}
                onChange={(ev) => setEvent(e.key, { template: ev.target.value })}
                rows={2}
                maxLength={320}
                placeholder={e.placeholder}
              />
            )}
          </div>
        ))}
      </Card>

      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            notifications: {
              senderId: senderId.trim() || undefined,
              merchantAlertNumber: alertNumber.trim() || undefined,
              events: {
                placed: {
                  enabled: events.placed.enabled,
                  template: events.placed.template.trim() || undefined,
                },
                confirmed: {
                  enabled: events.confirmed.enabled,
                  template: events.confirmed.template.trim() || undefined,
                },
                shipped: {
                  enabled: events.shipped.enabled,
                  template: events.shipped.template.trim() || undefined,
                },
                delivered: {
                  enabled: events.delivered.enabled,
                  template: events.delivered.template.trim() || undefined,
                },
              },
            },
          })
        }
      />
    </div>
  );
}

/* ------------------------------- Customers -------------------------------- */

function CustomersTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const c = settings.customersConfig ?? {};
  const [allowAccounts, setAllowAccounts] = useState(c.allowAccounts ?? true);
  const [phoneOtp, setPhoneOtp] = useState(c.phoneOtpLogin ?? false);

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Customer accounts</h3>
        <ToggleRow
          label="Allow account creation"
          desc="Let shoppers register and track their orders."
          checked={allowAccounts}
          onChange={setAllowAccounts}
        />
        <ToggleRow
          label="Phone-OTP login"
          desc="Sign in with a one-time code sent over SMS (BD norm)."
          checked={phoneOtp}
          onChange={setPhoneOtp}
        />
      </Card>
      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            customersConfig: {
              allowAccounts,
              phoneOtpLogin: phoneOtp,
            },
          })
        }
      />
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {desc && (
          <span className="block text-xs text-muted-foreground">{desc}</span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
