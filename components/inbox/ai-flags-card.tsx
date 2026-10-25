"use client";
// coding-standard: maintained

import { ListPagination } from "@/components/ecommerce/list-pagination";
import { useFormatters } from "@/hooks/use-formatters";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { useInboxAiFlags } from "@/services/api";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/** The backend caps the review list at 50 a page. */
const PAGE_SIZES = [20, 50];

/**
 * Flagged AI replies (backend plan §12 Phase 3): every reply someone marked as wrong, newest flag
 * first, each with the customer message it answered — so the owner sees what the AI gets wrong
 * without opening every chat. Paging lives in the URL (prefix `flags`) like every list.
 */
export function AiFlagsCard() {
  const t = useTranslations("inbox.settings.flags");
  const tr = useTranslations("inbox.thread.flag.reason");
  const { formatDateTime } = useFormatters();
  const list = useListUrlState({ prefix: "flags", defaults: { limit: 20 }, limitOptions: PAGE_SIZES });
  const { data, isLoading, isFetching } = useInboxAiFlags({ page: list.page, limit: list.limit });
  const rows = data?.items ?? [];

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("intro")}</p>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((row) => (
            <li key={row.messageId} className="space-y-1.5 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  {tr(row.reason)}
                </span>
                <Link href={`/inbox?chat=${row.conversationId}`} className="text-xs text-primary hover:underline">
                  {t("openChat", { name: row.customerName ?? t("customer") })}
                </Link>
              </div>
              {row.customerText && (
                <p className="text-muted-foreground">
                  <span className="font-medium">{t("customerSaid")}</span> {row.customerText}
                </p>
              )}
              <p>
                <span className="font-medium">{t("aiReplied")}</span> {row.replyText}
              </p>
              {row.note && <p className="italic">“{row.note}”</p>}
              <p className="text-xs text-muted-foreground">
                {row.flaggedBy
                  ? t("flaggedBy", { name: row.flaggedBy, date: formatDateTime(row.flaggedAt) })
                  : t("flaggedAt", { date: formatDateTime(row.flaggedAt) })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <ListPagination
          page={data?.page ?? list.page}
          totalPages={data?.totalPages ?? 1}
          limit={list.limit}
          total={data?.total}
          onPageChange={list.setPage}
          onLimitChange={list.setLimit}
          pageSizes={PAGE_SIZES}
          isFetching={isFetching}
        />
      )}
    </Card>
  );
}
