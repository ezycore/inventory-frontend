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
import type {
  ShippingRuleMode,
  StorefrontPaymentMethod,
  StorefrontSettings,
  UpdateStorefrontSettingsDto,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Switch } from "@/ui/components/switch";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import { CourierSettings } from "@/components/ecommerce/courier-settings";

type LocationOption = { label: string; value: string };

type FormState = {
  published: boolean;
  displayName: string;
  storefrontLocationId: string;
  allowedPaymentMethods: StorefrontPaymentMethod[];
  shippingMode: ShippingRuleMode;
  flatFee: string;
  freeThreshold: string;
  defaultDeliveryCost: string;
};

const PAYMENT_METHODS: { value: StorefrontPaymentMethod; label: string }[] = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "bank", label: "Bank / Manual transfer" },
];

const SHIPPING_MODES: { value: ShippingRuleMode; label: string }[] = [
  { value: "none", label: "No shipping charge" },
  { value: "flat", label: "Flat fee per order" },
  { value: "free_over_threshold", label: "Free over a threshold" },
];

const num = (v: string): number | undefined =>
  v.trim() === "" ? undefined : Number(v);

/**
 * Public URL of the live storefront. Mirrors `proxy.ts`: when a storefront root
 * domain is configured the store is reached at `{slug}.{root}`, otherwise it is
 * path-based at `{origin}/s/{slug}`.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;
const storefrontUrl = (slug: string): string => {
  if (STOREFRONT_ROOT) return `https://${slug}.${STOREFRONT_ROOT}`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/s/${slug}`;
};

const toForm = (s: StorefrontSettings): FormState => ({
  published: s.published,
  displayName: s.displayName ?? "",
  storefrontLocationId: s.storefrontLocationId ?? "",
  allowedPaymentMethods: s.allowedPaymentMethods ?? ["cod"],
  shippingMode: s.shippingRule?.mode ?? "none",
  flatFee: s.shippingRule?.flatFee?.toString() ?? "",
  freeThreshold: s.shippingRule?.freeThreshold?.toString() ?? "",
  defaultDeliveryCost: s.defaultDeliveryCost?.toString() ?? "0",
});

export default function StoreSettingsPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  // Locations for the fulfillment selector.
  const { data: locationsRes } = useQuery({
    queryKey: ["locations", "storefront-options"],
    queryFn: () =>
      apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(
        "/locations?all=true&fields=_id,name",
      ),
    staleTime: 5 * 60 * 1000,
  });
  const locationOptions: LocationOption[] = (
    locationsRes?.data?.items ?? []
  ).map((l) => ({ label: l.name, value: l._id }));

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your online store and publish it to go live.
        </p>
      </div>

      {isLoading || !settings ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        // key remounts the form (re-seeding state from props) if settings change.
        <StoreSettingsForm
          key={settings._id ?? "settings"}
          settings={settings}
          locationOptions={locationOptions}
        />
      )}

      <CourierSettings />
    </div>
  );
}

function StoreSettingsForm({
  settings,
  locationOptions,
}: {
  settings: StorefrontSettings;
  locationOptions: LocationOption[];
}) {
  // Seeded synchronously from props — no effect needed.
  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const update = useUpdateStorefrontSettings();

  // Live store URL — shown only when the SAVED settings are published (the
  // authoritative state), so the link is never advertised before the store
  // is actually reachable.
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const liveUrl = slug ? storefrontUrl(slug) : null;

  const copyLiveUrl = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      toast.success("Store URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePayment = (m: StorefrontPaymentMethod, on: boolean) =>
    setForm((f) => ({
      ...f,
      allowedPaymentMethods: on
        ? Array.from(new Set([...f.allowedPaymentMethods, m]))
        : f.allowedPaymentMethods.filter((x) => x !== m),
    }));

  const save = () => {
    const dto: UpdateStorefrontSettingsDto = {
      published: form.published,
      displayName: form.displayName || undefined,
      storefrontLocationId: form.storefrontLocationId || undefined,
      allowedPaymentMethods: form.allowedPaymentMethods,
      defaultDeliveryCost: num(form.defaultDeliveryCost) ?? 0,
      shippingRule: {
        mode: form.shippingMode,
        flatFee: form.shippingMode === "none" ? undefined : num(form.flatFee),
        freeThreshold:
          form.shippingMode === "free_over_threshold"
            ? num(form.freeThreshold)
            : undefined,
      },
    };
    update.mutate(dto);
  };

  return (
    <div className="space-y-6">
      {/* Publish */}
      <Card>
        <CardHeader>
          <CardTitle>Publish store</CardTitle>
          <CardDescription>
            When on, your storefront is publicly reachable. A fulfillment
            location is required before you can publish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => set("published", v)}
            />
            <span className="text-sm">
              {form.published
                ? "Published — store is live"
                : "Unpublished — store is offline"}
            </span>
          </div>

          {settings.published && liveUrl && (
            <div className="mt-4 rounded-md border bg-muted/30 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                Your store is live at
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm font-medium text-primary underline underline-offset-2"
                >
                  {liveUrl}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyLiveUrl}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Visit
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Store name</Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Your store name"
            />
          </div>
          <div className="space-y-2">
            <Label>Fulfillment location</Label>
            <SimpleSelect
              value={form.storefrontLocationId}
              onValueChange={(v) => set("storefrontLocationId", v)}
              options={locationOptions}
              placeholder="Select the location that ships online orders"
            />
            <p className="text-xs text-muted-foreground">
              Online orders are fulfilled from this location&apos;s stock.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>
            Choose how shoppers can pay at checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAYMENT_METHODS.map((pm) => (
            <label key={pm.value} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={form.allowedPaymentMethods.includes(pm.value)}
                onCheckedChange={(c) => togglePayment(pm.value, c === true)}
              />
              {pm.label}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping &amp; delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Shipping rule</Label>
            <SimpleSelect
              value={form.shippingMode}
              onValueChange={(v) => set("shippingMode", v as ShippingRuleMode)}
              options={SHIPPING_MODES}
            />
          </div>
          {form.shippingMode !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="flatFee">
                {form.shippingMode === "free_over_threshold"
                  ? "Fee below threshold"
                  : "Flat fee"}
              </Label>
              <Input
                id="flatFee"
                type="number"
                min={0}
                value={form.flatFee}
                onChange={(e) => set("flatFee", e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          {form.shippingMode === "free_over_threshold" && (
            <div className="space-y-2">
              <Label htmlFor="freeThreshold">Free over (order subtotal)</Label>
              <Input
                id="freeThreshold"
                type="number"
                min={0}
                value={form.freeThreshold}
                onChange={(e) => set("freeThreshold", e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="defaultDeliveryCost">
              Default courier cost (your expense, editable per order)
            </Label>
            <Input
              id="defaultDeliveryCost"
              type="number"
              min={0}
              value={form.defaultDeliveryCost}
              onChange={(e) => set("defaultDeliveryCost", e.target.value)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
