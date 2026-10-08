"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldX } from "lucide-react";

import { useFormatters } from "@/hooks/use-formatters";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { isExpiryPast } from "@/lib/org-calendar";
import type { SaleItem } from "@/types";

/**
 * The warranty frozen on a sale line, as one muted line under the item name —
 * "12 months · Replacement · until 03 Oct 2027". Red once it has run out, on the
 * org's calendar (`until` is date-only, covered through its last day). Renders
 * nothing for a line sold without a warranty.
 */
export function SaleLineWarranty({ warranty }: { warranty: SaleItem["warranty"] }) {
  const t = useTranslations("sales.warranty");
  const { formatDateOnly } = useFormatters();
  const { timezone } = useOrgCalendar();
  if (!warranty) return null;

  const expired = isExpiryPast(warranty.until, timezone);
  const Icon = expired ? ShieldX : ShieldCheck;
  const date = formatDateOnly(warranty.until);

  return (
    <span className={`inline-flex items-center gap-1 ${expired ? "text-destructive" : ""}`}>
      <Icon className="h-3 w-3" />
      {t("lookup.months", { months: warranty.months })} · {t(`kinds.${warranty.kind}`)} ·{" "}
      {expired ? t("lookup.expiredOn", { date }) : t("lookup.until", { date })}
    </span>
  );
}
