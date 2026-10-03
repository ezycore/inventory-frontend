"use client";
// coding-standard: maintained
/**
 * Receipt & Print panels for everything below the letterhead (print-setup-v2
 * P2–P8): item columns, totals, signature + stamp, payment details, terms, QR,
 * per-document overrides and thermal/print controls. All edit the draft form
 * state (saved with the page's Save button) EXCEPT the signature/stamp images,
 * which upload immediately like the org logo.
 */
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Plus, Trash2, Upload } from "lucide-react";

import type { ReceiptFormState, ReceiptSettingsActions } from "@/hooks";
import { useUpdateReceiptImages } from "@/services/api";
import {
  DEFAULT_SIGNATURE_IMAGE_HEIGHT_MM,
  MAX_PAYMENT_DETAILS,
  resolveDocumentOverride,
  type ReceiptDocumentKind,
  type ReceiptDocumentOverride,
  type ReceiptFontScale,
  type ReceiptImage,
  type ReceiptLineVatMode,
  type ReceiptPaymentDetail,
  type ReceiptQrSource,
  type ReceiptWalletAccountType,
  type ReceiptWalletProvider,
} from "@/types/receipt";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

import { Panel, ToggleRow } from "./receipt-panel";

interface PanelProps {
  state: ReceiptFormState;
  actions: ReceiptSettingsActions;
}

/** A labelled select over a small fixed option list. */
const OptionSelect = ({
  id,
  label,
  value,
  options,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  hint?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

/** "Inherit / on / off" for a per-document boolean override. */
const triValue = (v: boolean | undefined) => (v === undefined ? "inherit" : v ? "on" : "off");
const fromTri = (v: string): boolean | undefined =>
  v === "inherit" ? undefined : v === "on";

// ─── P2 ─────────────────────────────────────────────────────────────────────

export function ItemColumnsPanel({
  state,
  actions,
  vatActive,
}: PanelProps & { vatActive: boolean }) {
  const t = useTranslations("settings.receipt.v2");
  const cols = state.itemColumns;
  return (
    <Panel title={t("itemColumns.title")} hint={t("itemColumns.hint")}>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["serial", "unit", "code", "discount"] as const).map((key) => (
          <ToggleRow
            key={key}
            label={t(`itemColumns.${key}`)}
            hint={t(`itemColumns.${key}Hint`)}
            checked={cols[key] === true}
            onChange={(v) => actions.patchItemColumns({ [key]: v })}
          />
        ))}
      </div>
      {vatActive ? (
        <OptionSelect
          id="itemVat"
          label={t("itemColumns.vat")}
          value={cols.vat ?? "off"}
          onChange={(v) => actions.patchItemColumns({ vat: v as ReceiptLineVatMode })}
          options={(["off", "rate", "amount", "both"] as const).map((v) => ({
            value: v,
            label: t(`itemColumns.vatOptions.${v}`),
          }))}
          hint={t("itemColumns.vatHint")}
        />
      ) : null}
      <p className="text-xs text-muted-foreground">{t("itemColumns.snapshotHint")}</p>
    </Panel>
  );
}

// ─── P3 ─────────────────────────────────────────────────────────────────────

export function TotalsPanel({
  state,
  actions,
  accountsEnabled,
}: PanelProps & { accountsEnabled: boolean }) {
  const t = useTranslations("settings.receipt.v2");
  const totals = state.totals;
  const tendered =
    totals.showTenderedChange === undefined ? "auto" : totals.showTenderedChange ? "always" : "never";
  return (
    <Panel title={t("totals.title")} hint={t("totals.hint")}>
      <div className="grid gap-2 sm:grid-cols-2">
        <ToggleRow
          label={t("totals.showDue")}
          hint={t("totals.showDueHint")}
          checked={totals.showDue !== false}
          onChange={(v) => actions.patchTotals({ showDue: v })}
        />
        <ToggleRow
          label={t("totals.showPaymentMethods")}
          hint={t("totals.showPaymentMethodsHint")}
          checked={totals.showPaymentMethods === true}
          onChange={(v) => actions.patchTotals({ showPaymentMethods: v })}
        />
        <ToggleRow
          label={t("totals.showPreviousBalance")}
          hint={t("totals.showPreviousBalanceHint")}
          checked={totals.showPreviousBalance === true}
          onChange={(v) => actions.patchTotals({ showPreviousBalance: v })}
        />
      </div>
      <OptionSelect
        id="tenderedChange"
        label={t("totals.showTenderedChange")}
        value={tendered}
        onChange={(v) =>
          actions.patchTotals({
            showTenderedChange: v === "auto" ? undefined : v === "always",
          })
        }
        options={(["auto", "always", "never"] as const).map((v) => ({
          value: v,
          label: t(`totals.tenderedOptions.${v}`),
        }))}
        hint={t("totals.tenderedHint")}
      />
      {!accountsEnabled ? (
        <p className="text-xs text-amber-600">{t("totals.accountsOff")}</p>
      ) : null}
    </Panel>
  );
}

// ─── P4 ─────────────────────────────────────────────────────────────────────

const imgUrl = (img?: ReceiptImage | null) => img?.thumbnailUrl ?? img?.mediumUrl ?? img?.url;

/** One upload slot (signature or stamp). Uploads and saves immediately. */
const ImageSlot = ({
  field,
  label,
  image,
}: {
  field: "signature" | "stamp";
  label: string;
  image?: ReceiptImage | null;
}) => {
  const t = useTranslations("settings.receipt.v2");
  const input = useRef<HTMLInputElement>(null);
  const upload = useUpdateReceiptImages();
  const url = imgUrl(image);
  const send = (fd: FormData) => upload.mutate(fd);
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex h-16 items-center justify-center rounded bg-muted/40">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail, sized by CSS
          <img src={url} alt="" className="max-h-14 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">{t("signature.noImage")}</span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.append(field, file);
          send(fd);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {url ? t("signature.replace") : t("signature.upload")}
        </Button>
        {url ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={upload.isPending}
            onClick={() => {
              const fd = new FormData();
              fd.append(field === "signature" ? "removeSignature" : "removeStamp", "true");
              send(fd);
            }}
          >
            {t("signature.remove")}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export function SignaturePanel({
  state,
  actions,
  signatureImage,
  stampImage,
}: PanelProps & { signatureImage?: ReceiptImage | null; stampImage?: ReceiptImage | null }) {
  const t = useTranslations("settings.receipt.v2");
  const sig = state.signature;
  const enabled = sig.enabled !== false;
  return (
    <Panel title={t("signature.title")} hint={t("signature.hint")}>
      <ToggleRow
        label={t("signature.enabled")}
        checked={enabled}
        onChange={(v) => actions.patchSignature({ enabled: v })}
      />
      {enabled ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sigLeft">{t("signature.leftLabel")}</Label>
              <Input
                id="sigLeft"
                value={sig.leftLabel ?? ""}
                onChange={(e) => actions.patchSignature({ leftLabel: e.target.value })}
                placeholder={t("signature.leftPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sigRight">{t("signature.rightLabel")}</Label>
              <Input
                id="sigRight"
                value={sig.rightLabel ?? ""}
                onChange={(e) => actions.patchSignature({ rightLabel: e.target.value })}
                placeholder={t("signature.rightPlaceholder")}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageSlot field="signature" label={t("signature.signatureImage")} image={signatureImage} />
            <ImageSlot field="stamp" label={t("signature.stampImage")} image={stampImage} />
          </div>
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="sigHeight">{t("signature.imageHeight")}</Label>
            <NumberField
              id="sigHeight"
              value={sig.imageHeightMm ?? DEFAULT_SIGNATURE_IMAGE_HEIGHT_MM}
              onChange={(n) => n !== null && actions.patchSignature({ imageHeightMm: n })}
              min={10}
              max={35}
              precision={0}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("signature.securityHint")}</p>
        </>
      ) : null}
      <p className="text-xs text-muted-foreground">{t("signature.a4Hint")}</p>
    </Panel>
  );
}

// ─── P5 ─────────────────────────────────────────────────────────────────────

const PaymentDetailRow = ({
  detail,
  isFirst,
  isLast,
  actions,
}: {
  detail: ReceiptPaymentDetail;
  isFirst: boolean;
  isLast: boolean;
  actions: ReceiptSettingsActions;
}) => {
  const t = useTranslations("settings.receipt.v2");
  const set = (patch: Partial<ReceiptPaymentDetail>) => actions.updatePaymentDetail(detail.id, patch);
  const field = (key: keyof ReceiptPaymentDetail, label: string, placeholder?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`${detail.id}-${key}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`${detail.id}-${key}`}
        value={(detail[key] as string | undefined) ?? ""}
        onChange={(e) => set({ [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      <div className="flex flex-col pt-0.5">
        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={isFirst}
          onClick={() => actions.movePaymentDetail(detail.id, -1)} aria-label={t("payment.moveUp")}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={isLast}
          onClick={() => actions.movePaymentDetail(detail.id, 1)} aria-label={t("payment.moveDown")}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">
          {detail.kind === "bank" ? t("payment.bank") : t("payment.wallet")}
        </p>
        {detail.kind === "bank" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {field("bankName", t("payment.bankName"))}
            {field("accountName", t("payment.accountName"))}
            {field("accountNumber", t("payment.accountNumber"))}
            {field("branch", t("payment.branch"))}
            {field("routingNumber", t("payment.routingNumber"))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <OptionSelect
              id={`${detail.id}-provider`}
              label={t("payment.provider")}
              value={detail.provider ?? "bkash"}
              onChange={(v) => set({ provider: v as ReceiptWalletProvider })}
              options={(["bkash", "nagad", "rocket", "upay", "other"] as const).map((v) => ({
                value: v,
                label: t(`payment.providers.${v}`),
              }))}
            />
            <OptionSelect
              id={`${detail.id}-type`}
              label={t("payment.accountType")}
              value={detail.accountType ?? "personal"}
              onChange={(v) => set({ accountType: v as ReceiptWalletAccountType })}
              options={(["personal", "merchant", "agent"] as const).map((v) => ({
                value: v,
                label: t(`payment.accountTypes.${v}`),
              }))}
            />
            {field("number", t("payment.number"), "01XXXXXXXXX")}
            {field("label", t("payment.label"), t("payment.labelPlaceholder"))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 pt-0.5">
        <Switch
          checked={detail.visible}
          onCheckedChange={(v) => set({ visible: v })}
          aria-label={detail.visible ? t("payment.hide") : t("payment.show")}
        />
        <Button type="button" variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => actions.removePaymentDetail(detail.id)} aria-label={t("payment.remove")}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function PaymentDetailsPanel({ state, actions }: PanelProps) {
  const t = useTranslations("settings.receipt.v2");
  const full = state.paymentDetails.length >= MAX_PAYMENT_DETAILS;
  return (
    <Panel title={t("payment.title")} hint={t("payment.hint")}>
      {state.paymentDetails.length > 0 ? (
        <div className="space-y-2.5">
          {state.paymentDetails.map((d, i) => (
            <PaymentDetailRow
              key={d.id}
              detail={d}
              isFirst={i === 0}
              isLast={i === state.paymentDetails.length - 1}
              actions={actions}
            />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={full}
          onClick={() => actions.addPaymentDetail("wallet")}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("payment.addWallet")}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={full}
          onClick={() => actions.addPaymentDetail("bank")}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("payment.addBank")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("payment.notLinkedHint")}</p>
    </Panel>
  );
}

export function TermsPanel({ state, actions }: PanelProps) {
  const t = useTranslations("settings.receipt.v2");
  return (
    <Panel title={t("terms.title")} hint={t("terms.hint")}>
      <Textarea
        id="receiptTerms"
        value={state.terms}
        onChange={(e) => actions.update({ terms: e.target.value.slice(0, 1500) })}
        placeholder={t("terms.placeholder")}
        rows={4}
        className="resize-y"
      />
    </Panel>
  );
}

// ─── P6 ─────────────────────────────────────────────────────────────────────

export function QrPanel({
  state,
  actions,
  storefrontEnabled,
}: PanelProps & { storefrontEnabled: boolean }) {
  const t = useTranslations("settings.receipt.v2");
  const qr = state.qr;
  const source = qr.source ?? "off";
  const sources: ReceiptQrSource[] = storefrontEnabled
    ? ["off", "storefront", "custom"]
    : ["off", "custom"];
  return (
    <Panel title={t("qr.title")} hint={t("qr.hint")}>
      <OptionSelect
        id="qrSource"
        label={t("qr.source")}
        value={source}
        onChange={(v) => actions.patchQr({ source: v as ReceiptQrSource })}
        options={sources.map((v) => ({ value: v, label: t(`qr.sources.${v}`) }))}
      />
      {source === "custom" ? (
        <div className="space-y-1.5">
          <Label htmlFor="qrCustom">{t("qr.customValue")}</Label>
          <Input
            id="qrCustom"
            value={qr.customValue ?? ""}
            onChange={(e) => actions.patchQr({ customValue: e.target.value.slice(0, 300) })}
            placeholder="https://facebook.com/yourshop"
          />
        </div>
      ) : null}
      {source !== "off" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="qrLabel">{t("qr.label")}</Label>
            <Input
              id="qrLabel"
              value={qr.label ?? ""}
              onChange={(e) => actions.patchQr({ label: e.target.value })}
              placeholder={t("qr.labelPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qrSize">{t("qr.size")}</Label>
            <NumberField
              id="qrSize"
              value={qr.sizeMm ?? 24}
              onChange={(n) => n !== null && actions.patchQr({ sizeMm: n })}
              min={15}
              max={40}
              precision={0}
            />
          </div>
        </div>
      ) : null}
      {source !== "off" ? (
        <p className="text-xs text-muted-foreground">{t("qr.placementHint")}</p>
      ) : null}
    </Panel>
  );
}

// ─── P7 ─────────────────────────────────────────────────────────────────────

const OverridableText = ({
  id,
  label,
  value,
  onChange,
  multiline,
  max,
}: {
  id: string;
  label: string;
  /** undefined = inherit, null = none, string = custom */
  value: string | null | undefined;
  onChange: (v: string | null | undefined) => void;
  multiline?: boolean;
  max: number;
}) => {
  const t = useTranslations("settings.receipt.v2");
  const mode = value === undefined ? "inherit" : value === null ? "none" : "custom";
  return (
    <div className="space-y-1.5">
      <OptionSelect
        id={`${id}-mode`}
        label={label}
        value={mode}
        onChange={(m) => onChange(m === "inherit" ? undefined : m === "none" ? null : value ?? "")}
        options={(["inherit", "custom", "none"] as const).map((v) => ({
          value: v,
          label: t(`documents.textModes.${v}`),
        }))}
      />
      {mode === "custom" ? (
        multiline ? (
          <Textarea id={id} rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value.slice(0, max))} />
        ) : (
          <Input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value.slice(0, max))} />
        )
      ) : null}
    </div>
  );
};

export function DocumentOverridesPanel({
  state,
  actions,
  docKind,
}: PanelProps & { docKind: ReceiptDocumentKind }) {
  const t = useTranslations("settings.receipt.v2");
  const own = state.documents[docKind] ?? {};
  // Show the effective value (built-in defaults included) so the merchant sees
  // why a PO prints no payment details before they touch anything.
  const effective = resolveDocumentOverride(docKind, state.documents);
  const set = (patch: Partial<ReceiptDocumentOverride>) =>
    actions.setDocumentOverride(docKind, { ...own, ...patch });
  const setSig = (patch: NonNullable<ReceiptDocumentOverride["signature"]>) =>
    set({ signature: { ...own.signature, ...patch } });
  const tri = (key: "showPaymentDetails" | "showQr", label: string) => (
    <OptionSelect
      id={`doc-${key}`}
      label={label}
      value={triValue(own[key] ?? effective[key])}
      onChange={(v) => set({ [key]: fromTri(v) })}
      options={(["inherit", "on", "off"] as const).map((v) => ({
        value: v,
        label: t(`documents.triModes.${v}`),
      }))}
    />
  );
  return (
    <Panel
      title={t("documents.title", { doc: t(`documents.kinds.${docKind}`) })}
      hint={t("documents.hint")}
    >
      <div className="space-y-1.5">
        <Label htmlFor="docTitle">{t("documents.docTitle")}</Label>
        <Input
          id="docTitle"
          value={own.title ?? ""}
          onChange={(e) => set({ title: e.target.value.slice(0, 40) || undefined })}
          placeholder={t("documents.docTitlePlaceholder")}
        />
      </div>
      <OverridableText id="docFooter" label={t("documents.footer")} value={own.footer}
        onChange={(v) => set({ footer: v })} multiline max={500} />
      <OverridableText id="docTerms" label={t("documents.terms")} value={own.terms}
        onChange={(v) => set({ terms: v })} multiline max={1500} />
      <div className="grid gap-4 sm:grid-cols-2">
        {tri("showPaymentDetails", t("documents.showPaymentDetails"))}
        {tri("showQr", t("documents.showQr"))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <OptionSelect
          id="docSig"
          label={t("documents.signature")}
          value={triValue(own.signature?.enabled)}
          onChange={(v) => setSig({ enabled: fromTri(v) })}
          options={(["inherit", "on", "off"] as const).map((v) => ({
            value: v,
            label: t(`documents.triModes.${v}`),
          }))}
        />
        <div className="space-y-1.5">
          <Label htmlFor="docSigLeft">{t("documents.leftLabel")}</Label>
          <Input
            id="docSigLeft"
            value={own.signature?.leftLabel ?? ""}
            onChange={(e) => setSig({ leftLabel: e.target.value || undefined })}
            placeholder={docKind === "deliveryNote" ? t("documents.receivedBy") : t("documents.inherit")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="docSigRight">{t("documents.rightLabel")}</Label>
          <Input
            id="docSigRight"
            value={own.signature?.rightLabel ?? ""}
            onChange={(e) => setSig({ rightLabel: e.target.value || undefined })}
            placeholder={t("documents.inherit")}
          />
        </div>
      </div>
      {docKind === "paymentReceipt" || docKind === "statement" ? (
        <p className="text-xs text-muted-foreground">{t("documents.noItemTableHint")}</p>
      ) : null}
    </Panel>
  );
}

// ─── P8 ─────────────────────────────────────────────────────────────────────

export function PrintControlsPanel({ state, actions }: PanelProps) {
  const t = useTranslations("settings.receipt.v2");
  const copies = state.copies ?? 1;
  return (
    <>
      <Panel title={t("thermal.title")} hint={t("thermal.hint")}>
        <SegmentedField
          label={t("thermal.fontScale")}
          value={state.thermal.fontScale ?? "md"}
          onChange={(v) => actions.patchThermal({ fontScale: v as ReceiptFontScale })}
          caption={false}
          options={(["sm", "md", "lg"] as const).map((v) => ({
            value: v,
            label: t(`thermal.fontScales.${v}`),
          }))}
        />
        <div className="space-y-1.5 sm:max-w-xs">
          <Label htmlFor="thermalMargin">{t("thermal.sideMargin")}</Label>
          <NumberField
            id="thermalMargin"
            value={state.thermal.sideMarginMm ?? null}
            onChange={(n) => actions.patchThermal({ sideMarginMm: n ?? undefined })}
            min={0}
            max={6}
            precision={1}
            placeholder={t("thermal.sideMarginPlaceholder")}
          />
        </div>
      </Panel>
      <Panel title={t("copies.title")} hint={t("copies.hint")}>
        <div className="sm:max-w-xs">
          <OptionSelect
            id="copies"
            label={t("copies.count")}
            value={String(copies)}
            onChange={(v) => actions.update({ copies: Number(v) })}
            options={["1", "2", "3"].map((v) => ({ value: v, label: v }))}
          />
        </div>
        {copies > 1 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: copies }, (_, i) => (
              <div key={i} className="space-y-1">
                <Label htmlFor={`copyLabel${i}`} className="text-xs">
                  {t("copies.labelN", { n: i + 1 })}
                </Label>
                <Input
                  id={`copyLabel${i}`}
                  value={state.copyLabels[i] ?? ""}
                  onChange={(e) => {
                    const next = [...state.copyLabels];
                    while (next.length <= i) next.push("");
                    next[i] = e.target.value.slice(0, 30);
                    actions.update({ copyLabels: next });
                  }}
                  placeholder={t(`copies.defaults.${i}`)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
      <Panel title={t("autoPrint.title")} hint={t("autoPrint.hint")}>
        <ToggleRow
          label={t("autoPrint.label")}
          hint={t("autoPrint.browserHint")}
          checked={state.autoPrintAfterSale}
          onChange={(v) => actions.update({ autoPrintAfterSale: v })}
        />
      </Panel>
    </>
  );
}
