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
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
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

/** The mark a row draws when the merchant has not picked one. */
const DEFAULT_ICON: StorefrontPaymentIcon = "card";

/**
 * One payment method: a 56px row that opens into its own editor.
 *
 * ⚠ **The row is the point.** Every method used to render every control at once
 * — title, subtitle, a six-button labelled icon picker, the account, a note card
 * and a field card, each in its own bordered box — so three methods made a page
 * thousands of pixels tall and nothing was scannable. Now the row carries what
 * you read (mark, title, subtitle, a one-line summary, the switch) and the
 * detail opens one at a time, two columns wide.
 *
 * The summary line is load-bearing rather than decoration: it answers "where
 * does this money go" and "does this one ask the shopper for anything" without
 * opening anything.
 *
 * `builtIn` is Cash on Delivery, which lives in the same list deliberately — as
 * a checkbox in its own block it read as a different kind of thing, and it
 * could not carry instructions. It has no title, subtitle, icon or delete,
 * because the platform owns those; it can still name an account and write a note.
 */
export function CustomPaymentMethodEditor({
  method,
  builtIn = false,
  enabled,
  open,
  summary,
  fields,
  reservedFieldCount,
  canMoveUp,
  canMoveDown,
  accountOptions,
  accountId,
  onToggleOpen,
  onAccountChange,
  onMethodChange,
  onEnabledChange,
  onFieldsChange,
  onMove,
  onRemove,
}: {
  method: StorefrontPaymentMethodDef;
  /** Cash on Delivery: same row, but the platform owns its name and mark. */
  builtIn?: boolean;
  enabled: boolean;
  open: boolean;
  /** The one-line recap the collapsed row shows — account and what it asks for. */
  summary: string;
  fields: CheckoutField[];
  /** Entries elsewhere in the checkout, which share the twelve-entry budget. */
  reservedFieldCount?: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** The workspace's accounts. Empty when the `accounts` feature is off. */
  accountOptions?: { label: string; value: string }[];
  accountId?: string;
  onToggleOpen: () => void;
  onAccountChange: (accountId: string) => void;
  onMethodChange: (next: StorefrontPaymentMethodDef) => void;
  onEnabledChange: (next: boolean) => void;
  onFieldsChange: (next: CheckoutField[]) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const inputId = method.id ?? "new";
  const title = method.title.trim() || (builtIn ? "Cash on Delivery" : "Untitled payment method");
  const icon = builtIn
    ? "coins"
    : ((STOREFRONT_PAYMENT_ICONS as readonly string[]).includes(method.icon ?? "")
        ? (method.icon as StorefrontPaymentIcon)
        : DEFAULT_ICON);

  return (
    <div className="border-t">
      {/*
        The whole row toggles, so reorder and the switch sit OUTSIDE it as
        siblings — nested inside they would open the row on every nudge.
        `md:` is the split: one line on a desktop, title-over-summary on a phone.
      */}
      <div
        className={cn(
          "grid items-center gap-x-3 gap-y-0.5 px-4 md:px-5",
          "grid-cols-[2rem_1fr_auto_auto] py-2.5",
          "md:h-14 md:grid-cols-[0.875rem_2rem_1fr_auto_auto_auto] md:py-0",
        )}
      >
        {/* Reorder. Two 12px chevrons is not a touch target, so a phone gets
            them in the open row instead of on the row itself. */}
        <div className="col-start-1 row-span-2 hidden flex-col md:col-auto md:row-auto md:flex">
          <button
            type="button"
            aria-label="Move up"
            disabled={!canMoveUp}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
            onClick={onMove.bind(null, -1)}
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={!canMoveDown}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
            onClick={onMove.bind(null, 1)}
          >
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div
          className={cn(
            "col-start-1 row-span-2 grid size-8 place-items-center rounded-md md:col-auto md:row-auto",
            enabled ? "bg-primary/15 text-primary" : "bg-foreground/[0.06] text-muted-foreground",
          )}
        >
          <Icon name={icon} size={18} />
        </div>

        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="col-start-2 min-w-0 text-left md:col-auto"
        >
          <span className="flex items-baseline gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium",
                !enabled && "text-muted-foreground",
              )}
            >
              {title}
            </span>
            {method.subtitle?.trim() ? (
              <span className="hidden truncate text-xs text-muted-foreground md:inline">
                {method.subtitle}
              </span>
            ) : null}
          </span>
        </button>

        {/* Phone puts the recap under the title; desktop keeps it on the line. */}
        <div className="col-start-2 truncate text-xs text-muted-foreground md:col-auto md:whitespace-nowrap">
          {summary}
        </div>

        <div className="col-start-3 row-span-2 flex items-center justify-end md:col-auto md:row-auto">
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-label={`Offer ${title} at checkout`}
          />
        </div>

        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={open ? `Close ${title}` : `Open ${title}`}
          className="col-start-4 row-span-2 grid size-8 place-items-center text-muted-foreground hover:text-foreground md:col-auto md:row-auto md:size-6"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open ? (
        <div className="grid grid-cols-1 gap-5 px-4 pb-5 md:grid-cols-[21.25rem_1fr] md:gap-7 md:px-5 md:pb-6 md:pl-[4.875rem]">
          {/* Identity, and where the money lands */}
          <div className="flex flex-col gap-3.5">
            {builtIn ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Built in — the shopper pays the rider, so its name and mark are
                ours. Everything else here works the same as any other method.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor={`pm-title-${inputId}`} className="text-xs font-normal text-muted-foreground">
                    Payment method title
                  </Label>
                  <Input
                    id={`pm-title-${inputId}`}
                    value={method.title}
                    maxLength={80}
                    placeholder="e.g. bKash payment"
                    className="h-11 md:h-9"
                    onChange={(event) => onMethodChange({ ...method, title: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`pm-subtitle-${inputId}`} className="text-xs font-normal text-muted-foreground">
                    Subtitle
                  </Label>
                  <Input
                    id={`pm-subtitle-${inputId}`}
                    value={method.subtitle ?? ""}
                    maxLength={160}
                    placeholder="e.g. Send Money, then enter the transaction ID"
                    className="h-11 md:h-9"
                    onChange={(event) =>
                      onMethodChange({ ...method, subtitle: event.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-muted-foreground">Icon</Label>
                  {/* Icon-only: six labelled buttons spent ~430px of width on a
                      20px decision. The name rides on the tooltip and the label. */}
                  <div className="flex flex-wrap gap-1.5">
                    {STOREFRONT_PAYMENT_ICONS.map((name) => {
                      const selected = (method.icon ?? DEFAULT_ICON) === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          aria-pressed={selected}
                          aria-label={PAYMENT_ICON_LABELS[name]}
                          title={PAYMENT_ICON_LABELS[name]}
                          onClick={() => onMethodChange({ ...method, icon: name })}
                          className={cn(
                            "grid size-11 place-items-center rounded-md border transition md:size-[2.125rem]",
                            selected
                              ? "border-primary text-primary ring-2 ring-primary/40"
                              : "border-input text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon name={name} size={17} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {accountOptions?.length && method.id ? (
              <div className="space-y-1.5">
                <Label htmlFor={`pm-account-${inputId}`} className="text-xs font-normal text-muted-foreground">
                  Receiving account
                </Label>
                {/* Without this, marking such an order paid fails with
                    NO_RECEIVING_ACCOUNT and the merchant picks an account by hand
                    on every single order. Optional on purpose: unset keeps exactly
                    that per-order prompt, which is the right behaviour for a
                    method whose money lands somewhere different each time. */}
                <SimpleSelect
                  id={`pm-account-${inputId}`}
                  value={accountId || NO_ACCOUNT}
                  onValueChange={(id) => onAccountChange(id === NO_ACCOUNT ? "" : id)}
                  options={[{ label: "Ask me each time", value: NO_ACCOUNT }, ...accountOptions]}
                />
                <p className="text-xs text-muted-foreground">
                  Where money from these orders is recorded when you mark one paid.
                </p>
              </div>
            ) : null}

            {/* Phone equivalent of the row's reorder chevrons. */}
            <div className="flex gap-2 md:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 flex-1"
                disabled={!canMoveUp}
                onClick={() => onMove(-1)}
              >
                <ChevronUp className="size-4" /> Move up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 flex-1"
                disabled={!canMoveDown}
                onClick={() => onMove(1)}
              >
                <ChevronDown className="size-4" /> Move down
              </Button>
            </div>

            {!builtIn ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 self-start text-destructive md:h-8"
                aria-label={`Remove ${title}`}
                onClick={onRemove}
              >
                <Trash2 className="size-4" /> Remove method
              </Button>
            ) : null}
          </div>

          {/* How to pay, and what to send back */}
          {method.id ? (
            <CheckoutCustomFields
              fields={fields}
              onChange={onFieldsChange}
              fixedPaymentMethod={method.id}
              reservedFieldCount={reservedFieldCount}
            />
          ) : (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Save to add the receiving account, the payment instructions and any
              details the shopper must send back — they all attach to this
              method&apos;s permanent id, which does not exist until then.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
