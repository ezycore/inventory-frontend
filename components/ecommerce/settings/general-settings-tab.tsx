"use client";
// coding-standard: maintained

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/services/api/query-keys";
import { selectOptions } from "@/services/api/select-options";
import type { OutOfStockBehavior, StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import {
  normalizeSocialProfile,
  SOCIAL_PROFILES,
  socialProfileError,
} from "@/lib/storefront-social";
import { Field, SaveBar, ToggleRow, useStoreSettingsSave } from "./settings-form-shared";
import { useStockTracked } from "@/hooks/use-stock-tracked";

/** Store-wide sold-out policy. A product can override it in Catalog → Products. */
const OUT_OF_STOCK_OPTIONS = [
  { value: "show", label: 'Show as "Out of stock"' },
  { value: "hide", label: "Hide from store" },
  { value: "backorder", label: "Allow backorder" },
];

function seedSocialProfiles(settings: StorefrontSettings): Record<string, string> {
  const profiles = Object.fromEntries(
    (settings.social?.profiles ?? []).map(({ platform, url }) => [platform, url]),
  );
  if (settings.social?.facebook && !profiles.facebook) profiles.facebook = settings.social.facebook;
  if (settings.social?.instagram && !profiles.instagram) profiles.instagram = settings.social.instagram;
  return profiles;
}

export function GeneralSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [displayName, setDisplayName] = useState(settings.displayName ?? "");
  const [phone, setPhone] = useState(settings.contact?.phone ?? "");
  const [email, setEmail] = useState(settings.contact?.email ?? "");
  const [address, setAddress] = useState(settings.contact?.address ?? "");
  const [profiles, setProfiles] = useState(() => seedSocialProfiles(settings));
  const [whatsapp, setWhatsapp] = useState(settings.social?.whatsapp ?? "");
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});
  const [locationId, setLocationId] = useState(settings.storefrontLocationId ?? "");
  const stockTracked = useStockTracked();
  const [outOfStock, setOutOfStock] = useState<OutOfStockBehavior>(
    settings.defaultOutOfStockBehavior ?? "show",
  );
  // The optional shopper pages. Unset means ON for all three, which is what
  // every store configured before these switches existed carries.
  const [searchPage, setSearchPage] = useState(settings.pagesConfig?.search !== false);
  const [cartPage, setCartPage] = useState(settings.pagesConfig?.cartPage !== false);
  const [accounts, setAccounts] = useState(
    settings.customersConfig?.allowAccounts !== false,
  );
  const { data } = useQuery({
    queryKey: queryKeys.locations.storefrontOptions(),
    queryFn: () => apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(selectOptions("locations", { fields: "_id,name" })),
    staleTime: 5 * 60 * 1000,
  });
  const options = (data?.data?.items ?? []).map((item) => ({ label: item.name, value: item._id }));

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Store details</h3><p className="text-xs text-muted-foreground">Basic information about your online store.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your store name" /></Field>
          <Field label="Currency"><Input value={settings.currency ?? ""} disabled /></Field>
          <Field label="Contact phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Contact email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Business address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field></div>
        </div>
      </Card>
      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Social profiles</h3><p className="text-xs text-muted-foreground">Shown by every storefront footer. Paste a secure URL or a simple @handle; leave it empty to hide it.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PROFILES.map((profile) => (
            <Field key={profile.key} label={profile.label}>
              <div className="relative">
                <Icon name={profile.icon as IconName} size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={profiles[profile.key] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setProfiles((current) => ({ ...current, [profile.key]: value }));
                    setSocialErrors((current) => ({ ...current, [profile.key]: socialProfileError(value) ?? "" }));
                  }}
                  placeholder={profile.placeholder}
                  aria-invalid={!!socialErrors[profile.key]}
                  className="pl-10"
                />
              </div>
              {socialErrors[profile.key] ? <p className="text-xs text-red-600">{socialErrors[profile.key]}</p> : null}
            </Field>
          ))}
        </div>
        <div className="border-t pt-4">
          <Field label="WhatsApp contact">
            <Input
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="+8801XXXXXXXXX or https://wa.me/8801XXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">Used by the contact launcher when it has no separate number.</p>
          </Field>
        </div>
      </Card>
      <Card className="space-y-4 p-5 shadow-none">
        {/* The location itself stays at every tier — an order has to be
            fulfilled from somewhere, and `provisionUntrackedInventory` pins the
            ghost row to it. Only the sentence changes: a business with no stock
            has no "online stock" for a location to back (QA-N7). */}
        <div><h3 className="text-sm font-semibold">Fulfillment location <span className="text-red-600">*</span></h3><p className="text-xs text-muted-foreground">{stockTracked ? "Which inventory location backs online stock. Required before publishing." : "Which location fulfils online orders. Required before publishing."}</p></div>
        <SimpleSelect value={locationId} onValueChange={setLocationId} options={options} placeholder="Select the location that ships online orders" className="max-w-sm" />
      </Card>
      {/* Not merely cosmetic here — the setting has no effect at all without
          stock tracking. `isStockTracked` is consulted BEFORE
          `resolveOutOfStockBehavior` on the server, deliberately: backorder is a
          per-product policy about tracked stock ("I have none right now, sell
          anyway"), untracked is an org capability ("this business has no concept
          of stock"). So this asked a merchant to choose between three outcomes
          none of which could occur (QA-N7). */}
      {stockTracked && (
      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">When a product is out of stock</h3><p className="text-xs text-muted-foreground">Applies to every product in the store. A single product can override this from Catalog → Products → Edit online listing.</p></div>
        <SimpleSelect
          value={outOfStock}
          onValueChange={(value) => setOutOfStock(value as OutOfStockBehavior)}
          options={OUT_OF_STOCK_OPTIONS}
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Hide</span> removes it from the store and 404s its page until it is back in stock · <span className="font-medium">Backorder</span> keeps it buyable past zero stock; those orders wait unreserved until you restock.
        </p>
      </Card>
      )}
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Shopper pages</h3>
          <p className="text-xs text-muted-foreground">
            Turn off a page your shop does not need. Order tracking links keep working either way.
          </p>
        </div>
        <ToggleRow
          label="Search"
          desc="The search box in your header and the search page. Off hides both."
          checked={searchPage}
          onChange={setSearchPage}
        />
        <ToggleRow
          label="Cart page"
          desc="The full cart page. Off keeps the slide-out cart and sends /cart to checkout."
          checked={cartPage}
          onChange={setCartPage}
        />
        <ToggleRow
          label="Customer accounts"
          desc="Sign-in and the account area. Off means guest checkout only — shoppers still track orders from the link you send them."
          checked={accounts}
          onChange={setAccounts}
        />
      </Card>
      <SaveBar pending={pending} onSave={() => {
        const errors = Object.fromEntries(
          SOCIAL_PROFILES.map(({ key }) => [key, socialProfileError(profiles[key] ?? "") ?? ""]),
        );
        setSocialErrors(errors);
        if (Object.values(errors).some(Boolean)) return;
        const supported = new Set<string>(SOCIAL_PROFILES.map(({ key }) => key));
        const normalizedProfiles = Object.entries(profiles)
          .map(([platform, url]) => ({
            platform,
            url: supported.has(platform)
              ? normalizeSocialProfile(platform as (typeof SOCIAL_PROFILES)[number]["key"], url)
              : url.trim(),
          }))
          .filter(({ url }) => !!url);
        save({
          displayName: displayName || undefined,
          storefrontLocationId: locationId || undefined,
          defaultOutOfStockBehavior: outOfStock,
          contact: { phone: phone || undefined, email: email || undefined, address: address || undefined },
          social: {
            whatsapp: whatsapp.trim() || undefined,
            profiles: normalizedProfiles,
          },
          // Two blocks, because the account switch predates the other two and
          // moving it would be a migration on live stores for a tidier shape.
          pagesConfig: { search: searchPage, cartPage },
          customersConfig: { allowAccounts: accounts },
        });
      }} />
    </div>
  );
}
