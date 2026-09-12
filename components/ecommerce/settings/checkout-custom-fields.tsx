"use client";
// coding-standard: maintained

import { useState } from "react";
import type { CheckoutField, StorefrontPaymentMethod } from "@/types";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Textarea } from "@/ui/components/textarea";
import { cn } from "@/ui/lib/utils";
import {
  NOTICE_SIZES,
  NOTICE_TONES,
  noticeMetrics,
  noticeSurfaceLiteral,
} from "@/lib/checkout-notice-style";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

/**
 * Editor for the merchant's own checkout entries.
 *
 * Two kinds share one ordered list so the merchant controls the sequence a
 * shopper meets them in: a **notice** is prose they write (a policy, an
 * instruction), an **input** is a question the shopper answers.
 *
 * **These never change a price.** A merchant may ask a shopper to state a
 * shipping charge; the answer arrives as text on the order and the merchant
 * applies it themselves by editing the order's shipping charge. Wiring a
 * shopper-typed value into the total would let an anonymous checkout set its own
 * price, which is why the backend stores these as inert labelled strings.
 */
/**
 * Raised from 5 when fields gained a payment-method condition. The cap is about
 * what a SHOPPER sees — a long checkout is the commonest reason an order is
 * abandoned — and a field scoped to one method is seen only by the shoppers who
 * picked it. One group per method now fits.
 */
const MAX_FIELDS = 12;

/**
 * Which editor owns a field — and there is exactly one, deliberately.
 *
 * The rule a merchant can actually hold in their head is: **an entry in the
 * Checkout tab is asked on every order; an entry under a payment method is asked
 * only for that method.** So ownership is simply whether the entry carries a
 * payment-method condition at all.
 *
 * That replaced a rule nobody could see. Ownership used to mean "scoped to
 * exactly ONE method", with two-method entries staying in Checkout and keeping a
 * "Show for payment method" picker — so unticking a method there made the entry
 * silently vanish from that tab and reappear under Payments, unasked. There is
 * no picker now, and nothing to migrate between tabs.
 */
export const isMethodOwnedField = (field: CheckoutField): boolean =>
  !!field.showWhen?.paymentMethods?.length;

/**
 * The method whose editor shows this field: the FIRST id in its condition.
 *
 * A single id is the only thing the Payments editor can now write, so this is
 * the identity function for anything it created. It takes the first id rather
 * than refusing a longer list so that a legacy multi-method entry — or one
 * written straight into the database — still appears in exactly one editor
 * instead of becoming invisible in both. Editing that group narrows it to the
 * one method, which the editor's own `emit` does.
 */
export const methodOwnerId = (field: CheckoutField): string | undefined =>
  field.showWhen?.paymentMethods?.[0];

/**
 * Put one tab's slice back into the stored list without disturbing the other's.
 *
 * Payments and Checkout both write `checkout.customFields`, and the PATCH replaces
 * that array wholesale — so whichever tab saves has to carry the other's entries
 * through untouched or they are deleted. The edited slice lands where its first
 * member sat, which preserves a merchant's interleaved ordering across a save.
 */
export const mergeCheckoutFieldGroup = (
  all: CheckoutField[],
  edited: CheckoutField[],
  belongsToGroup: (field: CheckoutField) => boolean,
): CheckoutField[] => {
  const merged: CheckoutField[] = [];
  let inserted = false;
  for (const field of all) {
    if (!belongsToGroup(field)) {
      merged.push(field);
    } else if (!inserted) {
      merged.push(...edited);
      inserted = true;
    }
  }
  if (!inserted) merged.push(...edited);
  return merged;
};

const KIND_OPTIONS = [
  { label: "Input — the shopper answers", value: "input" },
  { label: "Notice — text they read", value: "notice" },
];

const TYPE_OPTIONS = [
  { label: "Short text", value: "text" },
  { label: "Long text", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Choice list", value: "select" },
  { label: "Checkbox", value: "checkbox" },
];

/**
 * Where a field may go. Anchors, not positions — the store has four checkout
 * layouts and they do not share a row count, so "after the address" is the only
 * kind of answer that means the same thing in all of them.
 *
 * `after-address` is first AND the default: it is where every field rendered
 * before this setting existed, so a merchant who never opens the select keeps
 * the checkout they already have.
 */
const SLOT_OPTIONS = [
  { label: "After the delivery address (default)", value: "after-address" },
  { label: "After name and phone", value: "after-contact" },
  { label: "Above the payment methods", value: "before-payment" },
  { label: "Below the payment methods", value: "after-payment" },
  { label: "Just above the order button", value: "before-submit" },
];

/** Keys are stored on every order, so they are generated once and never reused. */
function newKey(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function CheckoutCustomFields({
  fields,
  onChange,
  fixedPaymentMethod,
  reservedFieldCount = 0,
  heading = "Extra checkout fields",
  description = "Asked on every order, whatever the shopper pays with. Each one picks its own place in the checkout; answers appear on the order and never change the total.",
}: {
  fields: CheckoutField[];
  onChange: (next: CheckoutField[]) => void;
  /** Lock entries to one method when this editor is embedded in Payments. */
  fixedPaymentMethod?: StorefrontPaymentMethod;
  /**
   * Entries the OTHER editor owns. The backend caps the stored array as a whole,
   * so an editor counting only its own slice would let a merchant build a list
   * the save then rejects.
   */
  reservedFieldCount?: number;
  heading?: string;
  description?: string;
}) {
  /**
   * Payment mode: the cut-down editor the Payments tab embeds.
   *
   * A payment method needs exactly two things — **a note** saying how to pay, and
   * **a field** collecting what the merchant must check afterwards (a bKash TrxID,
   * a bank reference). Everything else the checkout editor offers is noise here,
   * and one option was worse than noise: "Where it appears" let a merchant slot
   * their bKash instructions into the ADDRESS section, which is not a thing
   * anyone wants and looks broken when it happens. A payment note belongs under
   * the payment option, full stop, so the slot is forced rather than offered.
   *
   * Dropped with it: the field's help text, and its type and option list. A
   * transaction id is a short line of text; a dropdown or a number spinner has no
   * payment use case, and every control a merchant has to read before typing
   * "Transaction ID" is a control that should not be there.
   *
   * The note's STYLE stays, and is the exception that proves the rule. It was cut
   * once and that was wrong: when a shopper selects bKash, "send money to this
   * number" is the most important thing on the page, and plain text buries it.
   * Tone is the one control here whose whole job is to stop a payment instruction
   * being missed, so it earns its place where help text and input types do not.
   *
   * ⚠ This hides CONTROLS, not capability. The stored shape is the same
   * `CheckoutField`, so validation, required-gating, rendering and the order
   * snapshot stay the one implementation they always were.
   */
  const paymentMode = !!fixedPaymentMethod;
  const atCap = fields.length + reservedFieldCount >= MAX_FIELDS;
  const emit = (next: CheckoutField[]) =>
    onChange(
      fixedPaymentMethod
        ? next.map((field) => ({
            ...field,
            showWhen: { paymentMethods: [fixedPaymentMethod] },
          }))
        : next,
    );
  const update = (index: number, patch: Partial<CheckoutField>) =>
    emit(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  const add = (kind: CheckoutField["kind"]) =>
    emit([
      ...fields,
      {
        key: newKey(),
        kind,
        label: "",
        ...(kind === "input" ? { type: "text" as const, required: false } : {}),
        // A payment note is instructions, so it starts tinted rather than plain:
        // the merchant who never opens the style picker still gets a box the
        // shopper's eye lands on. Elsewhere a note is prose and stays plain.
        ...(kind === "notice" && fixedPaymentMethod ? { tone: "info" as const } : {}),
        ...(fixedPaymentMethod ? { slot: "after-payment" as const } : {}),
      },
    ]);

  return (
    <div className="space-y-3">
      <div>
        <Label>{heading}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {fields.map((field, index) => (
        <div key={field.key} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
            {paymentMode ? (
              <span className="text-sm font-medium">
                {field.kind === "notice" ? "Note" : "Field"}
              </span>
            ) : (
            <SimpleSelect
              value={field.kind}
              onValueChange={(kind) =>
                update(index, {
                  kind: kind as CheckoutField["kind"],
                  // A notice has no input semantics; drop them rather than keep
                  // them dormant and have them reappear on a later switch back.
                  type: kind === "input" ? (field.type ?? "text") : undefined,
                  required: kind === "input" ? field.required : undefined,
                  options: kind === "input" ? field.options : undefined,
                  // And an input has no notice styling. Same reasoning, other
                  // direction — an input carrying a dormant `tone` would render
                  // untinted and then change colour if it ever became a notice.
                  tone: kind === "notice" ? field.tone : undefined,
                  size: kind === "notice" ? field.size : undefined,
                })
              }
              options={KIND_OPTIONS}
              className="max-w-[220px]"
            />
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move down"
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => emit(fields.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {field.kind === "notice" && paymentMode ? (
            // Instructions run to several lines — account name, number, branch —
            // and a merchant typing them into a one-line box cannot see them.
            <Textarea
              value={field.label}
              maxLength={600}
              rows={3}
              placeholder="How to pay. e.g. Send Money to 01XXXXXXXXX (Personal), then enter the TrxID below."
              onChange={(e) => update(index, { label: e.target.value })}
            />
          ) : (
            <Input
              value={field.label}
              // A notice carries payment instructions now — account name, number,
              // branch and a reference line do not fit in 200. An input's label is
              // still held to 200: a 600-character question is not a label.
              maxLength={field.kind === "notice" ? 600 : 200}
              placeholder={
                field.kind === "notice"
                  ? "The text the shopper reads"
                  : paymentMode
                    ? "What to ask for, e.g. Transaction ID"
                    : "Field label, e.g. Preferred delivery time"
              }
              onChange={(e) => update(index, { label: e.target.value })}
            />
          )}

          {!paymentMode ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">
                Where it appears
              </Label>
              <SimpleSelect
                value={field.slot ?? "after-address"}
                onValueChange={(slot) =>
                  update(index, { slot: slot as CheckoutField["slot"] })
                }
                options={SLOT_OPTIONS}
                className="max-w-[320px]"
              />
            </div>
          ) : null}

          {field.kind === "notice" ? (
            <NoticeStyleFields field={field} onChange={(patch) => update(index, patch)} />
          ) : null}

          {field.kind === "input" ? (
            <>
              {!paymentMode ? (
                <Input
                  value={field.helpText ?? ""}
                  maxLength={300}
                  placeholder="Help text under the label (optional)"
                  onChange={(e) =>
                    update(index, { helpText: e.target.value || undefined })
                  }
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {!paymentMode ? (
                  <SimpleSelect
                    value={field.type ?? "text"}
                    onValueChange={(type) =>
                      update(index, { type: type as CheckoutField["type"] })
                    }
                    options={TYPE_OPTIONS}
                    className="max-w-[200px]"
                  />
                ) : null}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!field.required}
                    onCheckedChange={(value) => update(index, { required: value === true })}
                  />
                  Required
                </label>
              </div>
              {field.type === "select" && !paymentMode ? (
                <OptionsField
                  options={field.options}
                  onChange={(options) => update(index, { options })}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atCap}
          onClick={() => add("notice")}
        >
          Add note
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atCap}
          onClick={() => add("input")}
        >
          Add field
        </Button>
      </div>
      {atCap ? (
        <p className="text-xs text-muted-foreground">
          Twelve is the maximum across the whole checkout — a long checkout is a
          common reason an order is abandoned.
          {reservedFieldCount > 0
            ? ` ${reservedFieldCount} of them ${reservedFieldCount === 1 ? "is" : "are"} set up elsewhere.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The comma-separated options of a choice list.
 *
 * **It keeps the merchant's raw text in local state**, and that is the whole
 * point of it being a component. The input used to render
 * `field.options.join(", ")` and re-parse on every keystroke, which made the
 * separator impossible to type: `"Morning,"` parses to `["Morning", ""]`, the
 * empty tail is dropped as an option nobody wants to save, and the value joins
 * back to `"Morning"` — deleting the comma in the same frame it was typed. The
 * trailing space died to `.trim()` the same way. A merchant could only get two
 * options in by typing `"MorningEvening"` and going back to insert the comma.
 *
 * So: the text belongs to the person typing, and the parsed array belongs to the
 * form. Parsing still drops blanks and trims, because THAT is the value that
 * gets saved — it just no longer reaches back and rewrites what is on screen.
 *
 * Seeded once, on mount. Re-seeding from props would restore the old behaviour.
 * The card's `key={field.key}` is what makes that safe across a reorder: moving
 * a field up or down keeps its instance, so it keeps its text.
 */
function OptionsField({
  options,
  onChange,
}: {
  options?: string[];
  onChange: (options: string[]) => void;
}) {
  const [text, setText] = useState(() => (options ?? []).join(", "));
  return (
    <div className="space-y-1.5">
      <Input
        value={text}
        placeholder="Options, comma separated — e.g. Morning, Evening"
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean),
          );
        }}
      />
      <p className="text-xs text-muted-foreground">
        A choice list needs at least one option, or the shopper meets a control
        they cannot satisfy.
      </p>
    </div>
  );
}

/**
 * A notice's look: a tone and a size.
 *
 * **Tones, not a colour picker.** A hex a merchant types is the one value in the
 * storefront that cannot follow their brand, survive the dark toggle or respect
 * the palette they chose — and most hand-picked text-on-background pairs fail
 * contrast. Each tone resolves to storefront CSS variables instead, so it stays
 * readable everywhere and `Brand` tracks whatever accent colour the shop is on.
 *
 * The swatches are the preview. A notice is one box, so a chip painted in the
 * tone at the chosen size IS what the shopper will see — which is why this can
 * live in Store settings without the Customize page's live storefront frame.
 */
function NoticeStyleFields({
  field,
  onChange,
}: {
  field: CheckoutField;
  onChange: (patch: Partial<CheckoutField>) => void;
}) {
  const metrics = noticeMetrics(field.size);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-normal text-muted-foreground">Style</Label>
      <div className="flex flex-wrap gap-2">
        {NOTICE_TONES.map((tone) => {
          const surface = noticeSurfaceLiteral(tone.value);
          const selected = (field.tone ?? "plain") === tone.value;
          return (
            <button
              key={tone.value}
              type="button"
              aria-pressed={selected}
              title={tone.hint}
              onClick={() => onChange({ tone: tone.value })}
              className={cn(
                "rounded-md px-3 py-2 text-left transition",
                selected
                  ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                  : "opacity-80 hover:opacity-100",
              )}
              style={{
                background: surface.background,
                border: `1px solid ${surface.border}`,
                color: surface.color,
                fontWeight: surface.fontWeight,
              }}
            >
              <span className="block text-xs">{tone.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SimpleSelect
          value={field.size ?? "sm"}
          onValueChange={(size) => onChange({ size: size as CheckoutField["size"] })}
          options={NOTICE_SIZES}
          className="max-w-[160px]"
        />
        <p className="text-xs text-muted-foreground">
          “Brand” follows your store’s accent colour; the swatch here shows the
          default one.
        </p>
      </div>
      {field.label.trim() ? (
        <div
          className="rounded-md"
          style={{
            ...noticeSurfaceLiteral(field.tone),
            border: `1px solid ${noticeSurfaceLiteral(field.tone).border}`,
            padding: metrics.padding,
            fontSize: metrics.fontSize,
            lineHeight: metrics.lineHeight,
            whiteSpace: "pre-wrap",
          }}
        >
          {field.label}
        </div>
      ) : null}
    </div>
  );
}
