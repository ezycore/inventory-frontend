"use client";
// coding-standard: maintained

import { useState } from "react";
import type { CheckoutField } from "@/types";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@/ui/lib/utils";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/storefront-payment-methods";
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
}: {
  fields: CheckoutField[];
  onChange: (next: CheckoutField[]) => void;
}) {
  const update = (index: number, patch: Partial<CheckoutField>) =>
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Extra checkout fields</Label>
        <p className="text-xs text-muted-foreground">
          Each one picks its own place in the checkout. Answers appear on the order —
          they never change the order total.
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.key} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
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
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <Input
            value={field.label}
            // A notice carries payment instructions now — account name, number,
            // branch and a reference line do not fit in 200. An input's label is
            // still held to 200: a 600-character question is not a label.
            maxLength={field.kind === "notice" ? 600 : 200}
            placeholder={
              field.kind === "notice"
                ? "The text the shopper reads"
                : "Field label, e.g. Preferred delivery time"
            }
            onChange={(e) => update(index, { label: e.target.value })}
          />

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

          <VisibilityField
            showWhen={field.showWhen}
            onChange={(showWhen) => update(index, { showWhen })}
          />

          {field.kind === "notice" ? (
            <NoticeStyleFields field={field} onChange={(patch) => update(index, patch)} />
          ) : null}

          {field.kind === "input" ? (
            <>
              <Input
                value={field.helpText ?? ""}
                maxLength={300}
                placeholder="Help text under the label (optional)"
                onChange={(e) => update(index, { helpText: e.target.value || undefined })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <SimpleSelect
                  value={field.type ?? "text"}
                  onValueChange={(type) =>
                    update(index, { type: type as CheckoutField["type"] })
                  }
                  options={TYPE_OPTIONS}
                  className="max-w-[200px]"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!field.required}
                    onCheckedChange={(value) => update(index, { required: value === true })}
                  />
                  Required
                </label>
              </div>
              {field.type === "select" ? (
                <OptionsField
                  options={field.options}
                  onChange={(options) => update(index, { options })}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= MAX_FIELDS}
        onClick={() =>
          onChange([
            ...fields,
            { key: newKey(), kind: "input", type: "text", label: "", required: false },
          ])
        }
      >
        Add field
      </Button>
      {fields.length >= MAX_FIELDS ? (
        <p className="text-xs text-muted-foreground">
          Five is the maximum — a long checkout is the commonest reason an order is
          abandoned.
        </p>
      ) : null}
    </div>
  );
}

/**
 * When the entry is shown — every payment method, or only some.
 *
 * This is what makes per-method instructions and inputs possible: a notice
 * explaining where to send a bank transfer, and the reference field that goes
 * with it, both appear only once the shopper has chosen bank transfer.
 *
 * **Unticking every method would hide the field everywhere**, which is a state
 * no merchant wants and cannot see the effect of, so the last tick cannot be
 * removed — clearing it goes back to "every method" instead.
 *
 * The hidden half is enforced twice over, in the checkout AND in the order
 * service: a hidden field is never required and its answer is never stored. A
 * required bank field left demanding on a cash-on-delivery order would be an
 * order nobody can place.
 */
function VisibilityField({
  showWhen,
  onChange,
}: {
  showWhen?: CheckoutField["showWhen"];
  onChange: (showWhen: CheckoutField["showWhen"]) => void;
}) {
  const selected = showWhen?.paymentMethods;
  const all = !selected?.length;

  const toggle = (value: (typeof PAYMENT_METHOD_OPTIONS)[number]["value"]) => {
    // From "every method", the first tick means "only this one".
    const current = all ? [] : selected!;
    const next = current.includes(value)
      ? current.filter((m) => m !== value)
      : [...current, value];
    // Empty === every method, which is also the only sane reading of "none".
    onChange(next.length ? { paymentMethods: next } : undefined);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-normal text-muted-foreground">
        Show for payment method
      </Label>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={all}
            onCheckedChange={(value) => {
              if (value === true) onChange(undefined);
            }}
          />
          Every method
        </label>
        {PAYMENT_METHOD_OPTIONS.map((method) => (
          <label key={method.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!all && selected!.includes(method.value)}
              onCheckedChange={() => toggle(method.value)}
            />
            {method.label}
          </label>
        ))}
      </div>
      {!all ? (
        <p className="text-xs text-muted-foreground">
          Hidden for other methods — and while hidden it is never required, so it
          cannot block an order paid a different way.
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
