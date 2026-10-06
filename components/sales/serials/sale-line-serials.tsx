"use client";
// coding-standard: maintained
import { ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The serial / IMEI codes on a sale line, as one muted mono line under the
 * item name — "S/N: A1B2, C3D4". Renders nothing when the line carries none.
 * `highlight` marks the code a warranty lookup found.
 */
export function SaleLineSerials({
  serials,
  highlight,
}: {
  serials?: readonly string[] | null;
  highlight?: string;
}) {
  const t = useTranslations("sales.serials");
  if (!serials?.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs">
      <ScanLine className="h-3 w-3" />
      <span>{t("label")}:</span>
      {serials.map((code, i) => (
        <span
          key={code}
          className={`font-mono ${code === highlight ? "rounded bg-primary/10 px-1 font-semibold text-primary" : ""}`}
        >
          {code}
          {i < serials.length - 1 ? "," : ""}
        </span>
      ))}
    </span>
  );
}
