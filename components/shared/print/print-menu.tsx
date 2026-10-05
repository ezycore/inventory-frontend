"use client";
// coding-standard: maintained

import { ChevronDown, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import type { PaperSize } from "@/utils/print-documents";
import { useAuthStore } from "@/services/stores";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { cn } from "@ui/lib/utils";

interface PrintMenuProps {
  /** Print at the chosen paper size; returns false when printing couldn't start. */
  onPrint: (paper: PaperSize) => boolean;
  /** Label for the full-page options (e.g. "Invoice", "Purchase Order"), suffixed (A4)/(A5). */
  a4Label?: string;
  /** Org's pre-selected paper size — the one-click primary action. Defaults to A4. */
  defaultPaper?: PaperSize;
  /** Visual weight: "outline" (subtle, legacy) or "solid" (filled primary CTA). */
  appearance?: "outline" | "solid";
}

/**
 * Split print button: the primary segment prints at the org's default paper size
 * in one click; the caret opens the paper-size menu (A4 / A5 / 80mm / 58mm). Printing
 * renders into a hidden iframe (utils/print.ts) — no popups involved.
 */
export function PrintMenu({
  onPrint,
  a4Label = "A4",
  defaultPaper = "a4",
  appearance = "outline",
}: PrintMenuProps) {
  const t = useTranslations("common.print");
  // Single gate for every print entry point: hide when the org lacks the
  // Invoice Printing feature (the backend `invoicePrinting` featureGate).
  const features = useAuthStore((s) => s.user?.organization?.features);
  const run = (paper: PaperSize) => {
    if (!onPrint(paper)) toast.error(t("popupBlocked"));
  };

  if (!isFeatureEnabled(features, "invoicePrinting")) return null;

  const options: { paper: PaperSize; label: string }[] = [
    { paper: "a4", label: `${a4Label} (A4)` },
    { paper: "a5", label: `${a4Label} (A5)` },
    { paper: "thermal80", label: t("receipt80") },
    { paper: "thermal58", label: t("receipt58") },
  ];

  const solid = appearance === "solid";
  const btnVariant = solid ? "default" : "outline";
  // Seam between the two segments: solid draws a faint divider on its own tone;
  // outline collapses the shared border so the pair reads as one control.
  const caretSeam = solid
    ? "border-l border-primary-foreground/25"
    : "border-l-0";

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <Button
        type="button"
        variant={btnVariant}
        size="sm"
        className="whitespace-nowrap rounded-r-none"
        onClick={() => run(defaultPaper)}
      >
        <Printer className="h-4 w-4" />
        {t("print")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={btnVariant}
            size="sm"
            className={cn("rounded-l-none px-2", caretSeam)}
            aria-label={t("choosePaper")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((option) => (
            <DropdownMenuItem key={option.paper} onClick={() => run(option.paper)}>
              {option.label}
              {option.paper === defaultPaper ? t("defaultSuffix") : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
