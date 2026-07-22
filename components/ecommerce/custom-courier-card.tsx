"use client";
// coding-standard: maintained

import { useState } from "react";
import { Link2, Pencil, Phone, Plus, Trash2, Truck } from "lucide-react";
import {
  useCreateCustomCourier,
  useDeleteCustomCourier,
  useUpdateCustomCourier,
  type CustomCourierEntry,
  type CustomCourierPayload,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Spinner } from "@/ui/components/spinner";
import { Switch } from "@/ui/components/switch";

/**
 * Couriers the merchant defines themselves — anyone without an API integration
 * (RedX, Paperfly, a local rider, the shop's own delivery boy). Deliberately not
 * a `CourierRow`: there are no credentials to collect, no sandbox/live switch and
 * no connection to test, so the whole provider-credential apparatus is absent.
 *
 * Orders dispatched to one of these are advanced by hand — the shopper still sees
 * the same tracking timeline an API courier produces.
 */
export function CustomCourierCard({
  couriers,
}: {
  couriers: CustomCourierEntry[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Other couriers</CardTitle>
        <CardDescription>
          Ship with a courier we don&apos;t integrate with. You record the
          tracking number and update the delivery status yourself; your customer
          sees the progress on their order page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {couriers.length === 0 && !adding ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            No couriers added yet.
          </p>
        ) : (
          couriers.map((c) =>
            editingId === c._id ? (
              <CustomCourierForm
                key={c._id}
                courier={c}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <CustomCourierRow
                key={c._id}
                courier={c}
                onEdit={() => {
                  setAdding(false);
                  setEditingId(c._id);
                }}
              />
            ),
          )
        )}

        {adding ? (
          <CustomCourierForm onDone={() => setAdding(false)} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
          >
            <Plus />
            Add a courier
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Collapsed view of one partner: identity, the active toggle, edit + remove. */
function CustomCourierRow({
  courier,
  onEdit,
}: {
  courier: CustomCourierEntry;
  onEdit: () => void;
}) {
  const update = useUpdateCustomCourier();
  const remove = useDeleteCustomCourier();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Truck className="size-4" />
      </span>

      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold leading-tight">
          {courier.name}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          {courier.phone ? (
            <span className="flex items-center gap-1">
              <Phone className="size-3" />
              {courier.phone}
            </span>
          ) : null}
          {courier.trackingUrlTemplate ? (
            <span className="flex items-center gap-1">
              <Link2 className="size-3" />
              Tracking link
            </span>
          ) : null}
          {courier.defaultCharge != null ? (
            <span>{formatMoney(courier.defaultCharge, currency)} default</span>
          ) : null}
          {!courier.active ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Inactive
            </span>
          ) : null}
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Inactive keeps the partner on past orders but hides it from dispatch. */}
        <Switch
          checked={courier.active}
          disabled={update.isPending}
          onCheckedChange={(active) =>
            update.mutate({ id: courier._id, active })
          }
          aria-label={`Activate ${courier.name}`}
        />
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={remove.isPending}
          onClick={() => remove.mutate(courier._id)}
          aria-label="Remove"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {remove.isPending ? <Spinner /> : <Trash2 />}
        </Button>
      </div>
    </div>
  );
}

/** Add/edit form. `courier` absent = adding. */
function CustomCourierForm({
  courier,
  onDone,
}: {
  courier?: CustomCourierEntry;
  onDone: () => void;
}) {
  const create = useCreateCustomCourier();
  const update = useUpdateCustomCourier();

  const [name, setName] = useState(courier?.name ?? "");
  const [phone, setPhone] = useState(courier?.phone ?? "");
  const [template, setTemplate] = useState(courier?.trackingUrlTemplate ?? "");
  const [charge, setCharge] = useState<number | null>(
    courier?.defaultCharge ?? null,
  );

  const saving = create.isPending || update.isPending;
  const trimmedName = name.trim();

  const save = () => {
    // Blank optional fields are sent as "" rather than omitted, so clearing one
    // in the edit form actually clears it (an omitted key is left untouched).
    const body: CustomCourierPayload = {
      name: trimmedName,
      phone: phone.trim(),
      trackingUrlTemplate: template.trim(),
      defaultCharge: charge ?? undefined,
    };
    if (courier) {
      update.mutate({ id: courier._id, ...body }, { onSuccess: onDone });
    } else {
      create.mutate(body, { onSuccess: onDone });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-name" className="text-xs text-muted-foreground">
            Courier name
          </Label>
          <Input
            id="cc-name"
            value={name}
            maxLength={60}
            placeholder="RedX"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-phone" className="text-xs text-muted-foreground">
            Contact number (optional)
          </Label>
          <Input
            id="cc-phone"
            value={phone}
            maxLength={30}
            placeholder="01700000000"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="cc-track" className="text-xs text-muted-foreground">
            Tracking link (optional)
          </Label>
          <Input
            id="cc-track"
            value={template}
            maxLength={300}
            placeholder="https://redx.com.bd/track/{tracking}"
            onChange={(e) => setTemplate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Put <code className="font-mono">{"{tracking}"}</code> where the
            tracking number goes — your customer gets a clickable link.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-charge" className="text-xs text-muted-foreground">
            Default delivery charge (optional)
          </Label>
          <NumberField
            id="cc-charge"
            value={charge}
            onChange={setCharge}
            min={0}
            precision={2}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-3">
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={saving || !trimmedName}>
          {saving && <Spinner />}
          {courier ? "Save changes" : "Add courier"}
        </Button>
      </div>
    </div>
  );
}
