"use client";
// coding-standard: maintained

import {
  PAYMENT_ICON_LABELS,
  STOREFRONT_PAYMENT_ICONS,
  type CheckoutField,
  type StorefrontPaymentIcon,
  type StorefrontPaymentMethodDef,
} from "@/types";
import { Icon } from "@/components/storefront/sf-icons";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { CheckoutCustomFields } from "./checkout-custom-fields";

/**
 * "No account chosen", as a value a Select can actually hold.
 *
 * Radix reads `value=""` as "nothing selected" and falls back to the
 * placeholder, so an empty-string option renders a BLANK control rather than the
 * words "Ask me each time" — and unset has to be a visible choice, since it is
 * the right answer for a method whose money lands somewhere different each time.
 * Same sentinel trick as `AUTO_TERMS` on the Checkout tab.
 */
export const NO_ACCOUNT = "__none";

/**
 * One merchant-defined payment method: its wording, its instructions, and the
 * details the shopper has to send back.
 *
 * The note and the fields are NOT a payment-specific system — they are ordinary
 * `checkout.customFields` locked to this method's id, which is what lets them
 * reuse the storefront's one renderer, one required-field validator and one
 * order snapshot. This component only hides that plumbing.
 *
 * ⚠ **A method with no id has never been saved.** The backend mints the id from
 * the title on first save and then freezes it, so a field cannot be scoped to
 * this method until that has happened — hence the notice instead of the editor.
 */
export function CustomPaymentMethodEditor({
  method,
  enabled,
  fields,
  reservedFieldCount,
  canMoveUp,
  canMoveDown,
  accountOptions,
  accountId,
  onAccountChange,
  onMethodChange,
  onEnabledChange,
  onFieldsChange,
  onMove,
  onRemove,
}: {
  method: StorefrontPaymentMethodDef;
  enabled: boolean;
  fields: CheckoutField[];
  /** Entries elsewhere in the checkout, which share the twelve-entry budget. */
  reservedFieldCount?: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** The workspace's accounts. Empty when the `accounts` feature is off. */
  accountOptions?: { label: string; value: string }[];
  accountId?: string;
  onAccountChange: (accountId: string) => void;
  onMethodChange: (next: StorefrontPaymentMethodDef) => void;
  onEnabledChange: (next: boolean) => void;
  onFieldsChange: (next: CheckoutField[]) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const inputId = method.id ?? `new-${method.title.slice(0, 8)}`;

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">
            {method.title.trim() || "Untitled payment method"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {method.id
              ? `Saved as “${method.id}” — shown to shoppers by title.`
              : "New — its permanent id is set from the title when you save."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Move up"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Move down"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${method.title.trim() || "payment method"}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <label className="flex items-center justify-between gap-4 text-sm">
        <span>
          Offer at checkout
          <span className="block text-xs text-muted-foreground">
            Turn off to hide it from shoppers without deleting it or its notes.
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`pm-title-${inputId}`}>Payment method title</Label>
          <Input
            id={`pm-title-${inputId}`}
            value={method.title}
            maxLength={80}
            placeholder="e.g. bKash payment"
            onChange={(event) =>
              onMethodChange({ ...method, title: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pm-subtitle-${inputId}`}>Subtitle</Label>
          <Input
            id={`pm-subtitle-${inputId}`}
            value={method.subtitle ?? ""}
            maxLength={160}
            placeholder="e.g. Send Money, then enter the transaction ID"
            onChange={(event) =>
              onMethodChange({
                ...method,
                subtitle: event.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Icon</Label>
        {/* A closed set of shipped marks, not an upload. It exists so several
            methods tell themselves apart at a glance — a merchant with bKash,
            Nagad and a bank needs three different rows, and the alternative is
            storing brand logos, which means storage, validation and deciding
            whose trademark they may use. */}
        <div className="flex flex-wrap gap-2">
          {STOREFRONT_PAYMENT_ICONS.map((icon) => {
            const selected = (method.icon ?? "card") === icon;
            return (
              <button
                key={icon}
                type="button"
                aria-pressed={selected}
                aria-label={PAYMENT_ICON_LABELS[icon]}
                title={PAYMENT_ICON_LABELS[icon]}
                onClick={() => onMethodChange({ ...method, icon })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-3 py-2 text-[10px] transition",
                  selected
                    ? "border-foreground ring-2 ring-foreground ring-offset-1 ring-offset-background"
                    : "border-border opacity-80 hover:opacity-100",
                )}
              >
                <Icon name={icon as never} size={18} />
                {PAYMENT_ICON_LABELS[icon]}
              </button>
            );
          })}
        </div>
      </div>

      {accountOptions?.length ? (
        <div className="space-y-1.5">
          <Label htmlFor={`pm-account-${inputId}`}>Receiving account</Label>
          {/* Without this, marking such an order paid fails with
              NO_RECEIVING_ACCOUNT and the merchant picks an account by hand on
              every single order. Optional on purpose: unset keeps exactly that
              per-order prompt, which is the right behaviour for a method whose
              money lands somewhere different each time. */}
          <SimpleSelect
            value={accountId || NO_ACCOUNT}
            onValueChange={(id) => onAccountChange(id === NO_ACCOUNT ? "" : id)}
            options={[
              { label: "Ask me each time", value: NO_ACCOUNT },
              ...accountOptions,
            ]}
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            Where money from these orders is recorded when you mark one paid.
          </p>
        </div>
      ) : null}

      {method.id ? (
        <CheckoutCustomFields
          fields={fields}
          onChange={onFieldsChange}
          fixedPaymentMethod={method.id}
          reservedFieldCount={reservedFieldCount}
          heading="How to pay, and what to send back"
          description="A note tells the shopper how to pay you. A field collects what you need to check it — a transaction id, a reference. Both appear under this option once it is selected, and answers show on the order."
        />
      ) : (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Save to add the payment instructions and any details the shopper must
          send back — they attach to this method&apos;s permanent id, which does not
          exist until then.
        </p>
      )}
    </div>
  );
}
