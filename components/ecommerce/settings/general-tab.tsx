"use client";
// coding-standard: maintained

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/services/api/query-keys";
import { selectOptions } from "@/services/api/select-options";
import type { StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  Field,
  SaveBar,
  useSave,
  type Option,
} from "./settings-primitives";

/** Store Settings → General: store details, social links, fulfillment location. */
export function GeneralTab({ settings }: { settings: StorefrontSettings }) {
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
