"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import {
  getHeaderLineMeta,
  getLogoPlacementOptions,
  getMetaFieldOptions,
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
  const t = useTranslations("settings.receipt");
  const showsWatermark =
    state.logoPlacement === "watermark" || state.logoPlacement === "both";
  const showsLogo = state.logoPlacement !== "hidden";

  const profileLinkTag = (chunks: React.ReactNode) => (
    <button
      type="button"
      className="text-primary underline underline-offset-2"
      onClick={onNavigateProfile}
    >
      {chunks}
    </button>
  );

  const headerLineMeta = getHeaderLineMeta(t);

  return (
    <div className="space-y-5">
      {/* Contact values that feed the identity lines */}
      <Panel
        title={t("contactTitle")}
        hint={t("contactHint")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiptPhone">{t("phone")}</Label>
            <Input
              id="receiptPhone"
              value={state.phone}
              onChange={(e) => actions.update({ phone: e.target.value })}
              placeholder={t("phonePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptEmail">{t("email")}</Label>
            <Input
              id="receiptEmail"
              value={state.email}
              onChange={(e) => actions.update({ email: e.target.value })}
              placeholder={t("emailPlaceholder")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receiptTaxId">
            {t("taxIdLabel")}
          </Label>
          <Input
            id="receiptTaxId"
            value={state.taxId}
            onChange={(e) => actions.update({ taxId: e.target.value })}
            placeholder={t("taxIdPlaceholder")}
          />
        </div>
      </Panel>

      {/* Logo placement + watermark opacity */}
      <Panel title={t("logoTitle")} hint={t("logoHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="logoPlacement">{t("placementLabel")}</Label>
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
                {getLogoPlacementOptions(t).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showsWatermark ? (
            <div className="space-y-1.5">
              <Label htmlFor="watermarkOpacity">{t("watermarkOpacityLabel")}</Label>
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
            {t("watermarkHint")}
          </p>
        ) : null}
        {showsLogo && !hasLogo ? (
          <p className="text-xs text-amber-600">
            {t.rich("noLogoWarning", { link: profileLinkTag })}
          </p>
        ) : null}
      </Panel>

      {/* Reorderable identity lines */}
      <Panel
        title={t("letterheadLinesTitle")}
        hint={t("letterheadLinesHint")}
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
          {t("addCustomLine")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t.rich("linesFromProfile", {
            orgName: headerLineMeta.orgName.label,
            address: headerLineMeta.address.label,
            link: profileLinkTag,
          })}
        </p>
      </Panel>

      {/* Paper + alignment */}
      <Panel title={t("layoutTitle")} hint={t("layoutHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiptPaperSize">{t("paperSizeLabel")}</Label>
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
                <SelectItem value="a4">{t("paper.a4")}</SelectItem>
                <SelectItem value="thermal80">{t("paper.thermal80")}</SelectItem>
                <SelectItem value="thermal58">{t("paper.thermal58")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("paperSizeHint")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptHeaderAlign">{t("headerAlignLabel")}</Label>
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
                <SelectItem value="left">{t("align.left")}</SelectItem>
                <SelectItem value="center">{t("align.center")}</SelectItem>
                <SelectItem value="right">{t("align.right")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("headerAlignHint")}
            </p>
          </div>
        </div>
      </Panel>

      {/* Per-document lines: title, meta rows */}
      <Panel
        title={t("showOnDocsTitle")}
        hint={t("showOnDocsHint")}
      >
        <ToggleRow
          label={t("docTitleLabel")}
          hint={t("docTitleHint")}
          checked={state.showDocTitle}
          onChange={(v) => actions.update({ showDocTitle: v })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {getMetaFieldOptions(t).map((o) => (
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
        title={t("amountInWordsTitle")}
        hint={t("amountInWordsHint")}
      >
        <ToggleRow
          label={t("showAmountInWords")}
          checked={state.showAmountInWords}
          onChange={(v) => actions.update({ showAmountInWords: v })}
        />
        {state.showAmountInWords ? (
          <div className="space-y-1.5">
            <Label htmlFor="amountInWordsLabel">{t("captionLabel")}</Label>
            <Input
              id="amountInWordsLabel"
              value={state.amountInWordsLabel}
              onChange={(e) =>
                actions.update({ amountInWordsLabel: e.target.value })
              }
              placeholder={t("captionPlaceholder")}
            />
          </div>
        ) : null}
      </Panel>

      {/* Footer note */}
      <Panel title={t("footerTitle")} hint={t("footerHint")}>
        <Textarea
          id="receiptFooter"
          value={state.footer}
          onChange={(e) => actions.update({ footer: e.target.value })}
          placeholder={t("footerPlaceholder")}
          rows={3}
          className="resize-none"
        />
      </Panel>
    </div>
  );
}
