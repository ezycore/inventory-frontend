"use client";
// coding-standard: maintained
import { ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The serial / IMEI codes on a sale line, as one muted mono line under the
 * item name — "S/N: A1B2, C3D4". `highlight` marks the code a warranty lookup
 * found; `returned` codes are struck through; `missing` adds "· 2 missing" for
 * units sold without one. Renders nothing when there is nothing to say.
 */
export function SaleLineSerials({
  serials,
  highlight,
  returned,
  missing = 0,
}: {
  serials?: readonly string[] | null;
  highlight?: string;
  returned?: readonly string[] | null;
  missing?: number;
}) {
  const t = useTranslations("sales.serials");
  if (!serials?.length && missing <= 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs">
      <ScanLine className="h-3 w-3" />
      <span>{t("label")}:</span>
      {serials?.map((code, i) => {
        const isReturned = returned?.includes(code);
        return (
          <span key={code} className="font-mono">
            <span
              className={
                code === highlight
                  ? "rounded bg-primary/10 px-1 font-semibold text-primary"
                  : isReturned
                    ? "line-through opacity-70"
                    : undefined
              }
              title={isReturned ? t("returned") : undefined}
            >
              {code}
            </span>
            {isReturned && <span className="ml-0.5 font-sans">({t("returned")})</span>}
            {i < serials.length - 1 ? "," : ""}
          </span>
        );
      })}
      {missing > 0 && (
        <span className="text-amber-700 dark:text-amber-400">
          {serials?.length ? "· " : ""}
          {t("missing", { count: missing })}
        </span>
      )}
    </span>
  );
}
