// coding-standard: maintained
import { Plus } from "lucide-react";

import {
  HEADER_LINE_META,
  LOGO_PLACEMENT_OPTIONS,
  META_FIELD_OPTIONS,
  type ReceiptHeaderAlign,
  type ReceiptLogoPlacement,
  type ReceiptPaperSize,
} from "@/types/receipt";
import type { ReceiptFormState, ReceiptSettingsActions } from "@/hooks";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

import LetterheadLineRow from "./letterhead-line-row";

interface LetterheadBuilderProps {
  state: ReceiptFormState;
  actions: ReceiptSettingsActions;
  hasLogo: boolean;
  onNavigateProfile: () => void;
}

/** A titled, bordered section — one visual group per concern for even rhythm. */
const Panel = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 rounded-lg border p-4">
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    {children}
  </section>
);

/** A toggle row: label + optional hint on the left, switch on the right. */
const ToggleRow = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center justify-between gap-3 rounded-md border p-3">
    <span className="space-y-0.5">
      <span className="block text-sm font-medium">{label}</span>
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

export default function LetterheadBuilder({
  state,
  actions,
  hasLogo,
  onNavigateProfile,
}: LetterheadBuilderProps) {
  const showsWatermark =
    state.logoPlacement === "watermark" || state.logoPlacement === "both";
  const showsLogo = state.logoPlacement !== "hidden";

  const profileLink = (
    <button
      type="button"
      className="text-primary underline underline-offset-2"
      onClick={onNavigateProfile}
    >
      Organization profile
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Contact values that feed the identity lines */}
      <Panel
        title="Contact details"
        hint="Printed in the letterhead lines below."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiptPhone">Phone</Label>
            <Input
              id="receiptPhone"
              value={state.phone}
              onChange={(e) => actions.update({ phone: e.target.value })}
              placeholder="Phone shown on printouts"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptEmail">Email</Label>
            <Input
              id="receiptEmail"
              value={state.email}
              onChange={(e) => actions.update({ email: e.target.value })}
              placeholder="Email shown on printouts"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receiptTaxId">
            Tax Registration No. (VAT / BIN / TIN)
          </Label>
          <Input
            id="receiptTaxId"
            value={state.taxId}
            onChange={(e) => actions.update({ taxId: e.target.value })}
            placeholder="Leave blank to hide"
          />
        </div>
      </Panel>

      {/* Logo placement + watermark opacity */}
      <Panel title="Logo" hint="Where the logo prints on documents.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="logoPlacement">Placement</Label>
            <Select
              value={state.logoPlacement}
              onValueChange={(v) =>
                actions.update({ logoPlacement: v as ReceiptLogoPlacement })
              }
            >
              <SelectTrigger id="logoPlacement" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGO_PLACEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showsWatermark ? (
            <div className="space-y-1.5">
              <Label htmlFor="watermarkOpacity">Watermark opacity (%)</Label>
              <NumberField
                id="watermarkOpacity"
                value={Math.round(state.watermarkOpacity * 100)}
                onChange={(n) =>
                  actions.update({ watermarkOpacity: (n ?? 8) / 100 })
                }
                min={3}
                max={20}
                precision={0}
                showSteppers
              />
            </div>
          ) : null}
        </div>
        {showsWatermark ? (
          <p className="text-xs text-muted-foreground">
            Watermark prints on A4 only — thermal receipts can&apos;t render it.
          </p>
        ) : null}
        {showsLogo && !hasLogo ? (
          <p className="text-xs text-amber-600">
            No logo uploaded yet — add one on the {profileLink} to have it appear
            here.
          </p>
        ) : null}
      </Panel>

      {/* Reorderable identity lines */}
      <Panel
        title="Letterhead lines"
        hint="Reorder with the arrows, hide with the switch, and add your own lines."
      >
        <div className="space-y-2.5">
          {state.headerLines.map((line, i) => (
            <LetterheadLineRow
              key={line.id}
              line={line}
              isFirst={i === 0}
              isLast={i === state.headerLines.length - 1}
              actions={actions}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={actions.addCustomLine}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add custom line
        </Button>
        <p className="text-xs text-muted-foreground">
          {HEADER_LINE_META.orgName.label}, {HEADER_LINE_META.address.label} and
          the logo come from the {profileLink}.
        </p>
      </Panel>

      {/* Paper + alignment */}
      <Panel title="Layout" hint="Default paper size and how the header aligns.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiptPaperSize">Default paper size</Label>
            <Select
              value={state.paper}
              onValueChange={(v) =>
                actions.update({ paper: v as ReceiptPaperSize })
              }
            >
              <SelectTrigger id="receiptPaperSize" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (full page)</SelectItem>
                <SelectItem value="thermal80">Receipt — 80mm thermal</SelectItem>
                <SelectItem value="thermal58">Receipt — 58mm thermal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pre-selected in the print menu; still overridable per print.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptHeaderAlign">Header alignment</Label>
            <Select
              value={state.align}
              onValueChange={(v) =>
                actions.update({ align: v as ReceiptHeaderAlign })
              }
            >
              <SelectTrigger id="receiptHeaderAlign" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Aligns the logo, name and contact block.
            </p>
          </div>
        </div>
      </Panel>

      {/* Per-document lines: title, meta rows */}
      <Panel
        title="Show on documents"
        hint="Which details print under the letterhead (Date always shows)."
      >
        <ToggleRow
          label="Document title"
          hint="The “Tax Invoice” / “Purchase Order” heading."
          checked={state.showDocTitle}
          onChange={(v) => actions.update({ showDocTitle: v })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {META_FIELD_OPTIONS.map((o) => (
            <label
              key={o.key}
              className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
            >
              {o.label}
              <Switch
                checked={state.metaFields[o.key]}
                onCheckedChange={() => actions.toggleMeta(o.key)}
              />
            </label>
          ))}
        </div>
      </Panel>

      {/* Amount in words */}
      <Panel
        title="Amount in words"
        hint="Spell the invoice total out under the totals."
      >
        <ToggleRow
          label="Show amount in words"
          checked={state.showAmountInWords}
          onChange={(v) => actions.update({ showAmountInWords: v })}
        />
        {state.showAmountInWords ? (
          <div className="space-y-1.5">
            <Label htmlFor="amountInWordsLabel">Caption</Label>
            <Input
              id="amountInWordsLabel"
              value={state.amountInWordsLabel}
              onChange={(e) =>
                actions.update({ amountInWordsLabel: e.target.value })
              }
              placeholder="In words:"
            />
          </div>
        ) : null}
      </Panel>

      {/* Footer note */}
      <Panel title="Footer note" hint="Printed at the bottom of every document.">
        <Textarea
          id="receiptFooter"
          value={state.footer}
          onChange={(e) => actions.update({ footer: e.target.value })}
          placeholder="e.g. Thank you for your business! Returns accepted within 7 days."
          rows={3}
          className="resize-none"
        />
      </Panel>
    </div>
  );
}
