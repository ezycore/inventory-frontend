"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ShieldCheck, ShieldX } from "lucide-react";

import { useFormatters } from "@/hooks/use-formatters";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useWarrantyLookup,
  type WarrantyLookupLine,
  type WarrantyLookupSale,
} from "@/services/api";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";
import { SaleLineSerials } from "@/components/sales/serials/sale-line-serials";
import { ClaimCreateDialog } from "./claim-create-dialog";

/**
 * "Is this still under warranty?" — one box: an invoice number, a serial /
 * IMEI (searched across every branch, so the card names the branch) or a phone.
 * Every figure (`active`, `daysLeft`, `claimableQuantity`) is the server's own
 * reading on the org's calendar; nothing is re-derived here.
 */
export function WarrantyLookup() {
  const t = useTranslations("sales.warranty");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const { data: sales, isFetching } = useWarrantyLookup(query);
  const [claiming, setClaiming] = useState<{ sale: WarrantyLookupSale; line: WarrantyLookupLine } | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(text.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("lookup.placeholder")}
            className="pl-8"
            aria-label={t("lookup.placeholder")}
          />
        </div>
        <Button type="submit" disabled={!text.trim()}>
          {t("page.tabs.lookup")}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">{t("lookup.hint")}</p>

      {isFetching && <Skeleton className="h-32 w-full max-w-3xl" />}
      {!isFetching && query && sales?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("lookup.empty", { q: query })}</p>
      )}
      {!isFetching &&
        sales?.map((sale) => (
          <LookupSaleCard key={sale.saleId} sale={sale} onClaim={(line) => setClaiming({ sale, line })} />
        ))}

      {claiming && (
        <ClaimCreateDialog
          sale={claiming.sale}
          line={claiming.line}
          open
          onOpenChange={(open) => !open && setClaiming(null)}
        />
      )}
    </div>
  );
}

function LookupSaleCard({
  sale,
  onClaim,
}: {
  sale: WarrantyLookupSale;
  onClaim: (line: WarrantyLookupLine) => void;
}) {
  const t = useTranslations("sales.warranty");
  const { formatDate } = useFormatters();

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            {sale.invoiceNumber}
            {sale.lines.some((line) => line.matchedSerial) && (
              <Badge variant="secondary">{t("lookup.foundBySerial")}</Badge>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("lookup.soldOn", { date: formatDate(sale.saleDate) })} ·{" "}
            {sale.locationName ? `${t("lookup.branch", { branch: sale.locationName })} · ` : ""}
            {sale.customer
              ? [sale.customer.name, sale.customer.phone].filter(Boolean).join(" · ")
              : t("lookup.walkIn")}
          </span>
        </div>
        {sale.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("lookup.noWarranty")}</p>
        ) : (
          <ul className="divide-y">
            {sale.lines.map((line) => (
              <LookupLineRow key={line.lineIndex} line={line} onClaim={() => onClaim(line)} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LookupLineRow({ line, onClaim }: { line: WarrantyLookupLine; onClaim: () => void }) {
  const t = useTranslations("sales.warranty");
  const { formatDateOnly } = useFormatters();
  const canCreate = useHasPermission("warranty.create");
  const Icon = line.active ? ShieldCheck : ShieldX;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{line.productName}</span>
          <Badge variant="outline">
            {t("lookup.months", { months: line.warranty.months })} · {t(`kinds.${line.warranty.kind}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Icon className={line.active ? "h-4 w-4 text-green-600" : "h-4 w-4 text-destructive"} />
          {line.active ? (
            <>
              <span>{t("lookup.until", { date: formatDateOnly(line.warranty.until) })}</span>
              <span className="text-muted-foreground">
                {line.daysLeft === 0
                  ? t("lookup.lastDay")
                  : t("lookup.daysLeft", { days: line.daysLeft })}
              </span>
            </>
          ) : (
            <span className="text-destructive">
              {t("lookup.expiredOn", { date: formatDateOnly(line.warranty.until) })}
            </span>
          )}
        </div>
        {line.warranty.note && <p className="text-sm text-muted-foreground">{line.warranty.note}</p>}
        <div className="text-muted-foreground">
          <SaleLineSerials serials={line.serials} highlight={line.matchedSerial} returned={line.returnedSerials} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("lookup.quantities", {
            sold: line.quantity,
            returned: line.returnedQuantity,
            claimed: line.openClaimQuantity,
          })}
        </p>
      </div>
      {canCreate && line.claimableQuantity > 0 && (
        <Button size="sm" variant="outline" onClick={onClaim}>
          {t("lookup.logClaim")}
        </Button>
      )}
    </li>
  );
}
