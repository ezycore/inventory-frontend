"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/services/stores";
import { useGetOrganizationApi, useReceiptSettings } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { isFeatureEnabled, isTaxActive } from "@/lib/feature-utils";
import { useUpdateOrganization } from "@/services/api";
import type { ReceiptSettings } from "@/types/receipt";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Button } from "@/ui/components/button";
import LetterheadBuilder from "@/components/settings/letterhead-builder";
import {
  renderReceiptPreview,
  type PaperSize,
} from "@/utils/print-documents";

// Visible paper width in the preview so thermal receipts read as a narrow slip
// centered on a "desk", not a wide document with dead white space beside it.
const PREVIEW_PAPER_WIDTH: Record<PaperSize, string> = {
  a4: "min(100%, 800px)",
  thermal80: "302px", // 80mm ≈ 302px @ 96dpi
  thermal58: "219px", // 58mm ≈ 219px @ 96dpi
};

/**
 * Wrap the composed preview body + styles into a standalone iframe document: the
 * doc styles, then a preview-only override that drops the print paper-width off
 * `body` and re-hosts it on a centered white "paper" over a muted desk backdrop.
 */
const buildPreviewSrcDoc = (
  body: string,
  styles: string,
  paper: PaperSize,
): string =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${styles}
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      width: auto !important;
      padding: 16px !important;
      background: #f3f4f6 !important;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .preview-paper {
      width: ${PREVIEW_PAPER_WIDTH[paper]};
      background: #fff;
      padding: 14px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
      border-radius: 2px;
    }
  </style></head><body><div class="preview-paper">${body}</div></body></html>`;

export default function ReceiptSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.permissions?.includes("organization.edit") ?? false;
  // Printing is a licensed feature; without it this page has nothing to configure.
  const canPrint = isFeatureEnabled(user?.organization?.features, "invoicePrinting");
  const salesTaxActive = isTaxActive(user?.organization, "sales");

  const { data: orgData } = useGetOrganizationApi();
  const org = orgData?.data;
  const savedReceipt = org?.receiptSettings as ReceiptSettings | undefined;
  const hasLogo = !!(org?.logo?.url || org?.logo?.mediumUrl || org?.logo?.thumbnailUrl);

  const updateOrganization = useUpdateOrganization();
  const { state, actions, hasChanges, buildPayload } =
    useReceiptSettings(savedReceipt);
  const [previewHeight, setPreviewHeight] = useState(420);

  // The iframe reparses its whole document whenever `srcDoc` changes, so driving
  // it straight off `state` janks typing/toggling. Debounce the value that feeds
  // the preview: inputs stay instant (bound to `state`), the preview catches up.
  const previewState = useDebounce(state, 250);

  // Redirect users without the manage permission or the printing feature.
  useEffect(() => {
    if (!user) return;
    if (!canManage) {
      toast.error("You don't have permission to access this page");
      router.push("/");
    } else if (!canPrint) {
      toast.error("Invoice printing isn't enabled for your organization");
      router.push("/");
    }
  }, [user, canManage, canPrint, router]);

  // The live preview reuses the exact renderer the printout uses (over a sample
  // invoice), so what's shown here is what prints. Logo + address come from the
  // saved organization profile; the rest are the live (unsaved) form values.
  // Resolve the logo to a *string* so the memo below depends only on primitives.
  // (A raw `org.logo` object dep can churn identity and rebuild `srcDoc` — which
  // reloads the iframe — on every render, feeding an onLoad→resize→render loop.)
  const logoUrl =
    org?.logo?.url ?? org?.logo?.mediumUrl ?? org?.logo?.thumbnailUrl;

  const previewSrcDoc = useMemo(() => {
    const { body, styles } = renderReceiptPreview({
      paper: previewState.paper,
      align: previewState.align,
      orgName: org?.name,
      logoUrl,
      address: org?.address || undefined,
      phone: previewState.phone || undefined,
      email: previewState.email || undefined,
      taxId: previewState.taxId || undefined,
      footer: previewState.footer || undefined,
      logoPlacement: previewState.logoPlacement,
      watermarkOpacity: previewState.watermarkOpacity,
      headerLines: previewState.headerLines,
      metaFields: previewState.metaFields,
      showDocTitle: previewState.showDocTitle,
      showAmountInWords: previewState.showAmountInWords,
      amountInWordsLabel: previewState.amountInWordsLabel,
      currencyCode: org?.currency,
      salesTaxActive,
    });
    return buildPreviewSrcDoc(body, styles, previewState.paper);
  }, [previewState, org?.name, logoUrl, org?.address, org?.currency, salesTaxActive]);

  // Size the preview iframe to its content so short (thermal) receipts leave no
  // dead space below. Content is same-origin (allow-same-origin, no scripts), so
  // we can measure it; re-measure shortly after in case the logo loads late.
  // Bail when the height is unchanged: otherwise onLoad→setState→re-render can
  // reload the iframe and refire onLoad forever (the page-freeze this fixes).
  const measurePreview = (frame: HTMLIFrameElement | null) => {
    const doc = frame?.contentWindow?.document;
    if (!doc) return;
    const next = Math.max(doc.body.scrollHeight + 4, 220);
    setPreviewHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  };
  const handlePreviewLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const frame = e.currentTarget;
    measurePreview(frame);
    setTimeout(() => measurePreview(frame), 200);
  };

  if (!canManage || !canPrint) return null;

  const handleSave = () => {
    updateOrganization.mutate({ receiptSettings: buildPayload() });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipt & Print"
        subTitle="The letterhead printed on every invoice, receipt, purchase order and return."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letterhead</CardTitle>
            <CardDescription>
              Compose what prints at the top of every document — reorder lines,
              hide what you don&apos;t need, and add your own.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LetterheadBuilder
              state={state}
              actions={actions}
              hasLogo={hasLogo}
              onNavigateProfile={() => router.push("/profile")}
            />
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateOrganization.isPending}
              >
                {updateOrganization.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live preview — pinned so it stays in view while the builder scrolls. */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Live preview</CardTitle>
            <CardDescription>
              A sample invoice rendered exactly as it will print at the selected
              paper size.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Receipt preview"
              srcDoc={previewSrcDoc}
              sandbox="allow-same-origin"
              onLoad={handlePreviewLoad}
              style={{ height: previewHeight, maxHeight: "80vh" }}
              className="w-full rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
