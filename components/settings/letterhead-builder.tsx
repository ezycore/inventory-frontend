"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import {
  getHeaderLineMeta,
  getLogoPlacementOptions,
  getMetaFieldOptions,
  getWatermarkPositionOptions,
  DEFAULT_WATERMARK_SIZE,
  WATERMARK_SIZE_LIMITS,
  type ReceiptHeaderAlign,
  type ReceiptLogoPlacement,
  type ReceiptPaperSize,
  type ReceiptWatermarkPosition,
  type ReceiptDocumentKind,
  type ReceiptImage,
} from "@/types/receipt";
import type { ReceiptFormState, ReceiptSettingsActions } from "@/hooks";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

import LetterheadLineRow from "./letterhead-line-row";
import { Panel, ToggleRow } from "./receipt-panel";
import {
  DocumentOverridesPanel,
  ItemColumnsPanel,
  PaymentDetailsPanel,
  PrintControlsPanel,
  QrPanel,
  SignaturePanel,
  TermsPanel,
  TotalsPanel,
} from "./receipt-v2-panels";
import LogoSizeFields from "./logo-size-fields";

interface LetterheadBuilderProps {
  state: ReceiptFormState;
  actions: ReceiptSettingsActions;
  hasLogo: boolean;
  logoUrl?: string;
  /** Paper the preview shows; the per-paper logo size edits this one. */
  previewPaper: ReceiptPaperSize;
  /** Document the preview shows; the Documents tab edits its overrides. */
  docKind: ReceiptDocumentKind;
  vatActive: boolean;
  accountsEnabled: boolean;
  storefrontEnabled: boolean;
  signatureImage?: ReceiptImage | null;
  stampImage?: ReceiptImage | null;
  onTabChange?: (tab: string) => void;
  onNavigateProfile: () => void;
}

export default function LetterheadBuilder({
  state,
  actions,
  hasLogo,
  logoUrl,
  previewPaper,
  docKind,
  vatActive,
  accountsEnabled,
  storefrontEnabled,
  signatureImage,
  stampImage,
  onTabChange,
  onNavigateProfile,
}: LetterheadBuilderProps) {
  const t = useTranslations("settings.receipt");
  const showsWatermark =
    state.logoPlacement === "watermark" || state.logoPlacement === "both";
  const showsLogo = state.logoPlacement !== "hidden";
  const showsTopLogo =
    state.logoPlacement === "top" || state.logoPlacement === "both";
  const watermarkSize = state.watermarkSize ?? DEFAULT_WATERMARK_SIZE;

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
    <Tabs defaultValue="header" className="gap-4" onValueChange={onTabChange}>
      <div className="-mx-1 overflow-x-auto px-1">
        <TabsList className="w-max">
          <TabsTrigger value="header">{t("tabs.header")}</TabsTrigger>
          <TabsTrigger value="body">{t("tabs.body")}</TabsTrigger>
          <TabsTrigger value="footer">{t("tabs.footer")}</TabsTrigger>
          <TabsTrigger value="paper">{t("tabs.paper")}</TabsTrigger>
          <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="header" className="space-y-5">
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
        {showsWatermark && hasLogo ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="watermarkWidth">{t("watermarkWidthLabel")}</Label>
              <NumberField
                id="watermarkWidth"
                value={watermarkSize.widthPct}
                onChange={(n) =>
                  n !== null &&
                  actions.update({ watermarkSize: { ...watermarkSize, widthPct: n } })
                }
                min={WATERMARK_SIZE_LIMITS[0]}
                max={WATERMARK_SIZE_LIMITS[1]}
                precision={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="watermarkHeight">{t("watermarkHeightLabel")}</Label>
              <NumberField
                id="watermarkHeight"
                value={watermarkSize.heightPct}
                onChange={(n) =>
                  n !== null &&
                  actions.update({ watermarkSize: { ...watermarkSize, heightPct: n } })
                }
                min={WATERMARK_SIZE_LIMITS[0]}
                max={WATERMARK_SIZE_LIMITS[1]}
                precision={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="watermarkPosition">{t("watermarkPositionLabel")}</Label>
              <Select
                value={state.watermarkPosition}
                onValueChange={(v) =>
                  actions.update({ watermarkPosition: v as ReceiptWatermarkPosition })
                }
              >
                <SelectTrigger id="watermarkPosition" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getWatermarkPositionOptions(t).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        {showsTopLogo && hasLogo ? (
          <div className="space-y-1.5 border-t pt-4">
            <p className="text-sm font-medium">
              {t("logoSizeTitle", { paper: t(`paper.${previewPaper}`) })}
            </p>
            <LogoSizeFields
              paper={previewPaper}
              box={state.logoSize[previewPaper]}
              logoUrl={logoUrl}
              onChange={(box) => actions.setLogoBox(previewPaper, box)}
            />
          </div>
        ) : null}
        {showsLogo && !hasLogo ? (
          <p className="text-xs text-amber-600">
            {t.rich("noLogoWarning", { link: profileLinkTag })}
          </p>
        ) : null}
        {hasLogo ? (
          <p className="text-xs text-muted-foreground">
            {t.rich("changeLogoInProfile", { link: profileLinkTag })}
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
              onNavigateProfile={onNavigateProfile}
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

      {/* Alignment */}
      <Panel title={t("alignTitle")} hint={t("headerAlignHint")}>
        <div className="space-y-1.5 sm:max-w-xs">
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
        </div>
      </Panel>
      </TabsContent>

      <TabsContent value="body" className="space-y-5">
      <ItemColumnsPanel state={state} actions={actions} vatActive={vatActive} />
      <TotalsPanel state={state} actions={actions} accountsEnabled={accountsEnabled} />
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

      </TabsContent>

      <TabsContent value="footer" className="space-y-5">
      <SignaturePanel
        state={state}
        actions={actions}
        signatureImage={signatureImage}
        stampImage={stampImage}
      />
      <PaymentDetailsPanel state={state} actions={actions} />
      <TermsPanel state={state} actions={actions} />
      <QrPanel state={state} actions={actions} storefrontEnabled={storefrontEnabled} />
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
      </TabsContent>

      <TabsContent value="paper" className="space-y-5">
      <Panel title={t("paperTitle")} hint={t("paperHint")}>
        <div className="space-y-1.5 sm:max-w-xs">
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
              <SelectItem value="a5">{t("paper.a5")}</SelectItem>
              <SelectItem value="thermal80">{t("paper.thermal80")}</SelectItem>
              <SelectItem value="thermal58">{t("paper.thermal58")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("paperSizeHint")}
          </p>
        </div>
      </Panel>
      <PrintControlsPanel state={state} actions={actions} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-5">
        <DocumentOverridesPanel state={state} actions={actions} docKind={docKind} />
      </TabsContent>
    </Tabs>
  );
}
