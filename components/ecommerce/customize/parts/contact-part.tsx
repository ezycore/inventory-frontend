"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import Link from "next/link";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { OptionChip } from "@/ui/components/option-card";
import { Switch } from "@/ui/components/switch";
import { NumberField } from "@/ui/components/number-field";
import {
  PartBlock,
  PartHint,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { whatsappNumberLabel } from "@/lib/whatsapp-number";
import type { ContactButtonPage, StorefrontSettings } from "@/types";

/** Page keys in the order a shopper meets them, matching the rail's own logic. */
const PAGES: { value: ContactButtonPage; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "collection", label: "Collections" },
  { value: "product", label: "Product" },
  { value: "cart", label: "Cart" },
  { value: "checkout", label: "Checkout" },
  { value: "order", label: "Order tracking" },
  { value: "page", label: "Info pages" },
  { value: "account", label: "Account" },
];

const SIDES: { value: "right" | "left"; label: string }[] = [
  { value: "right", label: "Bottom right" },
  { value: "left", label: "Bottom left" },
];

/**
 * The floating chat button. Its on/off switch lives on the part row (like the
 * announcement bar), so the editor stays collapsed until the button is in use.
 *
 * The number is NOT edited here at all — it belongs to Settings → General, and
 * this part only states which one the button will use, with a link to the one
 * place that changes it. Two independently-edited copies of a phone number is
 * how a merchant ends up answering the wrong one.
 *
 * It is shown through `whatsappNumberLabel` because owners usually paste
 * WhatsApp's own share LINK rather than a number, and rendering that raw
 * overflowed the row.
 */
export function ContactPart({
  settings,
  draft,
  patchContactButton,
}: Pick<CustomizeDraftApi, "draft" | "patchContactButton"> & {
  settings: StorefrontSettings;
}) {
  const value = draft.contactButton;
  // The stored value may be a pasted share link; show the number it resolves to.
  const fallback = whatsappNumberLabel(settings.social?.whatsapp);

  if (!value.enabled) {
    return (
      <PartHint>
        {fallback
          ? `Turn it on to show a floating WhatsApp button on your store, using ${fallback}.`
          : "Add a WhatsApp number in Settings → General first — the button needs somewhere to send shoppers."}
      </PartHint>
    );
  }

  return (
    <div className="grid gap-3">
      {/*
        Read-only on purpose. The number belongs to Settings → General and has
        exactly ONE home — a second, independently-edited copy here is how a
        merchant ends up answering the wrong one. This states which number the
        button will use and links to the one place that changes it.
      */}
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
        <div className="min-w-0">
          <PartLabel>WhatsApp number</PartLabel>
          <p className="mt-0.5 truncate text-sm font-medium">{fallback}</p>
        </div>
        <Link
          href="/ecommerce/settings"
          className="flex-none text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Change in Settings
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Button label</Label>
          <Input
            value={value.label}
            onChange={(e) => patchContactButton({ label: e.target.value })}
            maxLength={40}
            placeholder="Chat with us"
          />
          <p className="text-xs text-muted-foreground">
            Product, cart and order pages use their own wording unless you set this.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Corner</Label>
          <div className="flex flex-wrap gap-2">
            {SIDES.map((s) => (
              <OptionChip
                key={s.value}
                selected={value.position === s.value}
                onSelect={() => patchContactButton({ position: s.value })}
              >
                {s.label}
              </OptionChip>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Greeting</Label>
        <Input
          value={value.greeting}
          onChange={(e) => patchContactButton({ greeting: e.target.value })}
          maxLength={200}
          placeholder="Hi {store}! {context}"
        />
        <p className="text-xs text-muted-foreground">
          What the shopper&apos;s message starts with.{" "}
          <code className="rounded bg-muted px-1 py-0.5">{"{store}"}</code> is your store
          name and <code className="rounded bg-muted px-1 py-0.5">{"{context}"}</code> is
          filled in with the product they were viewing, their cart, or their order number.
        </p>
      </div>

      <PartBlock
        label="Show on"
        hint="Nothing selected means every page. The button never shows on printed invoices or sign-in screens."
      >
        <div className="flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <OptionChip
              key={p.value}
              selected={value.showOn.length === 0 || value.showOn.includes(p.value)}
              onSelect={() =>
                patchContactButton({
                  // An empty list means "all", so the first click has to
                  // materialise the full list minus the one being turned off —
                  // otherwise unticking a page would select only that page.
                  showOn: togglePage(value.showOn, p.value),
                })
              }
            >
              {p.label}
            </OptionChip>
          ))}
        </div>
      </PartBlock>

      <ToggleBlock
        label="Reply hours"
        hint="Outside these hours the button dims and tells shoppers when you're back. It stays tappable — a message sent at midnight is still a lead."
        checked={value.hoursEnabled}
        onCheckedChange={(hoursEnabled) => patchContactButton({ hoursEnabled })}
      >
        {value.hoursEnabled ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                value={value.hoursFrom}
                onChange={(e) => patchContactButton({ hoursFrom: e.target.value })}
                placeholder="10:00"
                maxLength={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                value={value.hoursTo}
                onChange={(e) => patchContactButton({ hoursTo: e.target.value })}
                placeholder="20:00"
                maxLength={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Away message</Label>
              <Input
                value={value.offlineNote}
                onChange={(e) => patchContactButton({ offlineNote: e.target.value })}
                maxLength={120}
                placeholder="Back at 10 AM"
              />
            </div>
          </div>
        ) : null}
      </ToggleBlock>

      <ToggleBlock
        label="Greeting nudge"
        hint="Pops the button open once per visit with a short message. It interrupts the shopper — leave it off unless you're sure."
        checked={value.nudgeEnabled}
        onCheckedChange={(nudgeEnabled) => patchContactButton({ nudgeEnabled })}
      >
        {value.nudgeEnabled ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Input
                value={value.nudgeText}
                onChange={(e) => patchContactButton({ nudgeText: e.target.value })}
                maxLength={120}
                placeholder="Need help ordering? We reply in ~5 min."
              />
            </div>
            <div className="space-y-1.5">
              <Label>After</Label>
              <NumberField
                value={value.nudgeDelay}
                onChange={(v) => patchContactButton({ nudgeDelay: v ?? 8 })}
                min={2}
                max={120}
                precision={0}
                size="sm"
                className="w-24"
              />
            </div>
          </div>
        ) : null}
      </ToggleBlock>
    </div>
  );
}

/**
 * A sub-section of the part that is itself optional: heading, switch, and the
 * fields only once it is on. `PartBlock` deliberately has no switch slot — it
 * labels a group of controls — and both optional sections here need the same
 * treatment, so this is one local component rather than the same row twice.
 */
function ToggleBlock({
  label,
  hint,
  checked,
  onCheckedChange,
  children,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <PartLabel>{label}</PartLabel>
          <PartHint>{hint}</PartHint>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
          className="mt-0.5 flex-none"
        />
      </div>
      {children}
    </div>
  );
}

/**
 * Toggle one page in the whitelist, treating an EMPTY list as "all pages".
 *
 * The empty-means-all convention is what makes the storefront's default sane,
 * but it makes the first click here counter-intuitive unless it is handled:
 * naively pushing/removing would turn "everywhere" into "only the page I just
 * clicked". So the first removal expands the implicit all-list first, and a
 * selection that grows back to every page collapses to empty again.
 */
function togglePage(
  current: ContactButtonPage[],
  page: ContactButtonPage,
): ContactButtonPage[] {
  const all = PAGES.map((p) => p.value);
  const effective = current.length === 0 ? all : current;
  const next = effective.includes(page)
    ? effective.filter((p) => p !== page)
    : [...effective, page];
  return next.length === all.length ? [] : next;
}
