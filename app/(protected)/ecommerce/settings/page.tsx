"use client";

import { selectOptions } from "@/services/api/select-options";
import { queryKeys } from "@/services/api/query-keys";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  useContentPages,
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
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Checkbox } from "@/ui/components/checkbox";
import { Textarea } from "@/ui/components/textarea";
import { Skeleton } from "@/ui/components/skeleton";
import { SimpleSelect } from "@/ui/components/simple-select";
import { CourierSettings } from "@/components/ecommerce/courier-settings";
import { OrderStepLabelsSettings } from "@/components/ecommerce/order-step-labels-settings";
import { SeoSettings } from "@/components/ecommerce/seo-settings";
import { NotificationMatrix } from "@/components/notifications/notification-matrix";
import { copyText } from "@/utils/clipboard";

type Option = { label: string; value: string };

const TABS = [
  { id: "general", label: "General" },
  { id: "publish", label: "Publish" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "couriers", label: "Couriers" },
  { id: "checkout", label: "Checkout" },
  { id: "orderSteps", label: "Order steps" },
  { id: "seo", label: "SEO" },
  { id: "notifications", label: "Notifications" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function StoreSettingsPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div className="space-y-5">
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
    case "orderSteps":
      return <OrderStepLabelsSettings />;
    case "seo":
      return <SeoSettings settings={settings} />;
    case "notifications":
      return <NotificationsTab />;
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
  const [facebook, setFacebook] = useState(settings.social?.facebook ?? "");
  const [instagram, setInstagram] = useState(settings.social?.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(settings.social?.whatsapp ?? "");
  const [locationId, setLocationId] = useState(
    settings.storefrontLocationId ?? "",
  );

  const { data: locationsRes } = useQuery({
    queryKey: queryKeys.locations.storefrontOptions(),
    queryFn: () =>
      apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(
        selectOptions("locations", { fields: "_id,name" }),
      ),
    staleTime: 5 * 60 * 1000,
  });
  const locationOptions: Option[] = (locationsRes?.data?.items ?? []).map((l) => ({
    label: l.name,
    value: l._id,
  }));

  return (
    <div className="space-y-5">
      <Card className="space-y-1 p-5 shadow-none">
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

      <Card className="space-y-1 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Social links</h3>
          <p className="text-xs text-muted-foreground">
            Shown as icon links at the bottom of every page of your store. Leave a
            field empty to hide that link.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Facebook">
            <Input
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/8801XXXXXXXXX"
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-1 p-5 shadow-none">
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
            social: {
              facebook: facebook.trim() || undefined,
              instagram: instagram.trim() || undefined,
              whatsapp: whatsapp.trim() || undefined,
            },
          })
        }
      />
    </div>
  );
}

/* -------------------------------- Publish --------------------------------- */

function PublishTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [published, setPublished] = useState(settings.published);
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const hasFavicon = useAuthStore((s) => !!s.user?.organization?.favicon);
  const liveUrl = slug ? storefrontUrl(slug) : null;
  const locationSet = !!settings.storefrontLocationId;

  const copy = async () => {
    if (!liveUrl) return;
    try {
      await copyText(liveUrl);
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
          <div className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-200">
            ✓ Fulfillment location is set — you&apos;re ready to publish.
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200">
            Set a fulfillment location (General tab) before publishing.
          </div>
        )}

        {/* Advisory only — never blocks publishing. It earns its place because
            the consequence is invisible from the admin app: with no org favicon
            the shop's browser tab shows the *platform* mark on the merchant's
            own domain, and the favicon deliberately has no logo fallback to
            paper over it. */}
        {!hasFavicon && (
          <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            No browser tab icon set — your shop&apos;s tab will show the EzyCore
            icon. Add one under Settings → Organization. Your logo is not used
            for this.
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
  const [flatFee, setFlatFee] = useState<number | null>(
    settings.shippingRule?.flatFee ?? null,
  );
  const [freeThreshold, setFreeThreshold] = useState<number | null>(
    settings.shippingRule?.freeThreshold ?? null,
  );
  const [defaultDeliveryCost, setDefaultDeliveryCost] = useState<number | null>(
    settings.defaultDeliveryCost ?? 0,
  );
  const [zonesEnabled, setZonesEnabled] = useState(
    settings.shippingZones?.inside != null ||
      settings.shippingZones?.outside != null,
  );
  const [zoneInside, setZoneInside] = useState<number | null>(
    settings.shippingZones?.inside ?? null,
  );
  const [zoneOutside, setZoneOutside] = useState<number | null>(
    settings.shippingZones?.outside ?? null,
  );
  const [zoneFree, setZoneFree] = useState<number | null>(
    settings.shippingZones?.freeThreshold ?? null,
  );
  const [pickupEnabled, setPickupEnabled] = useState(
    !!settings.pickup?.enabled,
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    settings.pickup?.instructions ?? "",
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
            <NumberField
              min={0}
              precision={2}
              value={flatFee}
              onChange={setFlatFee}
              placeholder="0"
            />
          </Field>
        )}
        {mode === "free_over_threshold" && (
          <Field label="Free over (order subtotal)">
            <NumberField
              min={0}
              precision={2}
              value={freeThreshold}
              onChange={setFreeThreshold}
              placeholder="0"
            />
          </Field>
        )}
        <Field label="Default courier cost (your expense, editable per order)">
          <NumberField
            min={0}
            precision={2}
            value={defaultDeliveryCost}
            onChange={setDefaultDeliveryCost}
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
              <NumberField
                min={0}
                precision={2}
                value={zoneInside}
                onChange={setZoneInside}
                placeholder="60"
              />
            </Field>
            <Field label="Outside Dhaka fee">
              <NumberField
                min={0}
                precision={2}
                value={zoneOutside}
                onChange={setZoneOutside}
                placeholder="120"
              />
            </Field>
            <Field label="Free over (subtotal)">
              <NumberField
                min={0}
                precision={2}
                value={zoneFree}
                onChange={setZoneFree}
                placeholder="2000"
              />
            </Field>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Store pickup</h3>
            <p className="text-xs text-muted-foreground">
              Let shoppers collect from your store instead of courier delivery —
              no shipping fee. Pickup uses your fulfillment location.
            </p>
          </div>
          <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
        </div>
        {pickupEnabled && (
          <Field label="Pickup instructions (optional)">
            <Textarea
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Collect from the front counter, 10am–8pm. Bring your order number."
            />
          </Field>
        )}
      </Card>

      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            defaultDeliveryCost: defaultDeliveryCost ?? 0,
            pickup: {
              enabled: pickupEnabled,
              instructions: pickupInstructions.trim() || undefined,
            },
            shippingRule: {
              mode,
              flatFee: mode === "none" ? undefined : (flatFee ?? undefined),
              freeThreshold:
                mode === "free_over_threshold"
                  ? (freeThreshold ?? undefined)
                  : undefined,
            },
            // Blank stays undefined (not 0) — a 0 fee reads as "ships free", which
            // silently zeroed the zone's delivery charge. computeShipping falls back
            // to the shipping rule for any direction left unset. Disabled sends an
            // explicit `null` (not undefined, which JSON drops) so the backend
            // actually clears the stored zones instead of leaving them to resurrect.
            shippingZones: zonesEnabled
              ? {
                  inside: zoneInside ?? undefined,
                  outside: zoneOutside ?? undefined,
                  freeThreshold: zoneFree ?? undefined,
                }
              : null,
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
// Name + phone are always needed to fulfil an order, so they can't be turned off.
// (Area is also forced when Dhaka zone shipping is on — it prices the order.)
const LOCKED_FIELDS = ["name", "phone"];
// Sentinel for "no explicit terms page" — the checkout then auto-detects a page
// slugged like "terms" (Radix Select forbids an empty-string item value).
const AUTO_TERMS = "__auto";

function CheckoutTab({ settings }: { settings: StorefrontSettings }) {
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
        {/* <h3 className="text-sm font-semibold">Checkout</h3> */}
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
          })
        }
      />
    </div>
  );
}

/* ------------------------------ Notifications ----------------------------- */

/**
 * The storefront's notification tab is the shared matrix scoped to the
 * storefront domain — the canonical page is Settings → Notifications. It reads
 * the backend event registry, so order events and their channels are declared
 * in one place, not duplicated here.
 */
function NotificationsTab() {
  return (
    <div className="space-y-5">
      <Card className="p-5 shadow-none">
        <NotificationMatrix domains={["storefront"]} hideDomainTabs />
      </Card>
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
