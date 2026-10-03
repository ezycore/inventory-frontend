"use client";
// coding-standard: maintained
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, Link2Off } from "lucide-react";

import {
  DEFAULT_LOGO_SIZE,
  LOGO_SIZE_LIMITS,
  type ReceiptLogoBox,
  type ReceiptPaperSize,
} from "@/types/receipt";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";

interface LogoSizeFieldsProps {
  paper: ReceiptPaperSize;
  /** The paper's saved box; undefined → the built-in size is in effect. */
  box?: ReceiptLogoBox;
  logoUrl?: string;
  onChange: (box: ReceiptLogoBox | null) => void;
}

const clamp = (n: number, [lo, hi]: [number, number]) =>
  Math.round(Math.min(hi, Math.max(lo, n)) * 10) / 10;

/**
 * Natural width ÷ height of the uploaded logo, read once from the image. Null
 * until it loads (or when it fails), so the lock falls back to the box's ratio.
 */
const useLogoRatio = (url?: string): number | null => {
  const [ratio, setRatio] = useState<{ url: string; value: number } | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio({ url, value: img.naturalWidth / img.naturalHeight });
      }
    };
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);
  return ratio && ratio.url === url ? ratio.value : null;
};

/**
 * Height × width (mm) of the logo box for one paper. The values are a bounding
 * box — the printout keeps the logo's proportions — and the lock (default on)
 * recomputes the other side from the logo's natural ratio so "make it taller"
 * does what the merchant means.
 */
export default function LogoSizeFields({
  paper,
  box,
  logoUrl,
  onChange,
}: LogoSizeFieldsProps) {
  const t = useTranslations("settings.receipt");
  const [locked, setLocked] = useState(true);
  const logoRatio = useLogoRatio(logoUrl);
  const current = box ?? DEFAULT_LOGO_SIZE[paper];
  const limits = LOGO_SIZE_LIMITS[paper];
  const ratio = logoRatio ?? current.widthMm / current.heightMm;

  // While typing, NumberField emits the raw draft and clamps only on blur, so
  // the typed side is passed through; only the derived side is clamped here.
  const setHeight = (n: number | null) => {
    if (n === null) return;
    onChange({
      heightMm: n,
      widthMm: locked ? clamp(n * ratio, limits.width) : current.widthMm,
    });
  };
  const setWidth = (n: number | null) => {
    if (n === null) return;
    onChange({
      widthMm: n,
      heightMm: locked ? clamp(n / ratio, limits.height) : current.heightMm,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`logoHeight-${paper}`}>{t("logoHeightLabel")}</Label>
          <NumberField
            id={`logoHeight-${paper}`}
            value={current.heightMm}
            onChange={setHeight}
            min={limits.height[0]}
            max={limits.height[1]}
            precision={1}
            step={0.5}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mb-0.5 h-8 w-8 shrink-0"
          onClick={() => setLocked((v) => !v)}
          aria-pressed={locked}
          aria-label={locked ? t("unlockAspect") : t("lockAspect")}
          title={locked ? t("unlockAspect") : t("lockAspect")}
        >
          {locked ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
        </Button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`logoWidth-${paper}`}>{t("logoWidthLabel")}</Label>
          <NumberField
            id={`logoWidth-${paper}`}
            value={current.widthMm}
            onChange={setWidth}
            min={limits.width[0]}
            max={limits.width[1]}
            precision={1}
            step={0.5}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {t("logoSizeHint", {
            paper: t(`paper.${paper}`),
            hMin: limits.height[0],
            hMax: limits.height[1],
            wMin: limits.width[0],
            wMax: limits.width[1],
          })}
        </p>
        {box ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onChange(null)}
          >
            {t("logoSizeReset")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
