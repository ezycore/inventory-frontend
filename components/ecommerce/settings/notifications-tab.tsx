"use client";
// coding-standard: maintained

import { useState } from "react";
import type { StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Field, SaveBar, ToggleRow, useSave } from "./settings-primitives";

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

/**
 * Store Settings → Notifications: SMS sender config + per-event templates.
 * Pre-configuration only — SMS dispatch is not live yet, which the banner says.
 */
export function NotificationsTab({ settings }: { settings: StorefrontSettings }) {
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
      <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800">
        SMS delivery isn&apos;t live yet — only email notifications currently
        send. You can pre-configure your templates here; they&apos;ll start
        sending once SMS is enabled.
      </div>
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
          Once SMS is enabled, the gateway secret/API key is configured
          separately (encrypted) and dispatch is handled server-side.
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
