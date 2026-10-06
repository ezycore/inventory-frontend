"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";

import { useFormatters } from "@/hooks/use-formatters";
import { formatCurrency } from "@/lib/currency";
import { useWarrantyClaim, type WarrantyClaim } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Badge } from "@/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import { ClaimActions } from "./claim-actions";
import { claimStatusTone } from "./claim-status";

/** One warranty claim: what was promised, what is wrong, where it stands, what happened. */
export function ClaimDetailSheet({
  claimId,
  onClose,
}: {
  claimId: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("sales.warranty");
  const { data: claim, isLoading } = useWarrantyClaim(claimId ?? "");

  return (
    <Sheet open={!!claimId} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-y-auto sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>{claim?.claimNumber ?? "…"}</SheetTitle>
          <SheetDescription>
            {claim ? `${claim.invoiceNumber} · ${claim.productName} × ${claim.quantity}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 p-4">
          {isLoading || !claim ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <ClaimSummary claim={claim} />
              <ClaimActions claim={claim} />
              <ClaimHistory claim={claim} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ClaimSummary({ claim }: { claim: WarrantyClaim }) {
  const t = useTranslations("sales.warranty");
  const { formatDateOnly, formatDate } = useFormatters();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  return (
    <dl className="grid gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={claimStatusTone(claim.status)}>{t(`status.${claim.status}`)}</Badge>
        {claim.resolution && (
          <span className="text-muted-foreground">
            {t("detail.resolution")}: {t(`detail.resolutions.${claim.resolution}`)}
          </span>
        )}
      </div>
      <div>
        <dt className="text-muted-foreground">{t("detail.warranty")}</dt>
        <dd>
          {t(`kinds.${claim.warranty.kind}`)} ·{" "}
          {t("detail.validUntil", { date: formatDateOnly(claim.warranty.until) })}
          <span className={claim.coveredAtIntake ? "ml-2 text-green-600" : "ml-2 text-destructive"}>
            {claim.coveredAtIntake ? t("detail.coveredAtIntake") : t("detail.outOfWarrantyAtIntake")}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{t("detail.issue")}</dt>
        <dd className="whitespace-pre-wrap">{claim.issue}</dd>
      </div>
      {claim.notes && (
        <div>
          <dt className="text-muted-foreground">{t("detail.notes")}</dt>
          <dd className="whitespace-pre-wrap">{claim.notes}</dd>
        </div>
      )}
      {claim.serviceCharge != null && (
        <div>
          <dt className="text-muted-foreground">{t("detail.serviceCharge")}</dt>
          <dd>{formatCurrency(claim.serviceCharge, currency)}</dd>
        </div>
      )}
      {claim.replacement && (
        <p className="rounded-md bg-muted p-2">
          {t("detail.replacement", {
            quantity: claim.replacement.quantity,
            date: formatDate(claim.replacement.replacedAt),
          })}
        </p>
      )}
    </dl>
  );
}

function ClaimHistory({ claim }: { claim: WarrantyClaim }) {
  const t = useTranslations("sales.warranty");
  const { formatDateTime } = useFormatters();
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{t("detail.history")}</h3>
      <ol className="space-y-2 border-l pl-4 text-sm">
        {[...claim.history].reverse().map((entry, i) => (
          <li key={`${entry.at}-${i}`}>
            <div className="font-medium">{t(`status.${entry.status}`)}</div>
            <div className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</div>
            {entry.note && <div className="text-muted-foreground">{entry.note}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}
