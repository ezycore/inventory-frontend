"use client";
// coding-standard: maintained

import { useState } from "react";
import { useGetMetaSettings, useMetaEvents } from "@/services/api";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import EmptyState from "@/ui/components/EmptyState";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { MetaEventsTable } from "@/components/ecommerce/meta-events-table";

/**
 * What EzyCore told Meta, and why anything was skipped.
 *
 * The skipped rows are the reason this screen exists. A merchant asking "why isn't this sale in my
 * Meta reporting" has exactly two possible answers — a rule they configured, or a failure — and
 * before this page the only way to tell them apart was to read the server logs.
 */
const TABS = [
  { id: "", label: "All" },
  { id: "sent", label: "Reported" },
  { id: "pending", label: "Queued" },
  { id: "failed", label: "Failed" },
  { id: "skipped", label: "Not sent" },
] as const;

export default function MetaEventsPage() {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: settings } = useGetMetaSettings();
  const { data, isLoading, isFetching } = useMetaEvents({
    page,
    limit,
    status: status || undefined,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meta ad reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every sale EzyCore reported to Meta — and every one it deliberately did not.
        </p>
      </div>

      {settings && !settings.capiReady ? (
        <Card className="p-4 text-sm text-muted-foreground shadow-none">
          Meta reporting isn&apos;t connected yet. Set it up in Store Settings → Meta pixel.
        </Card>
      ) : null}

      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatus(tab.id);
              setPage(1);
            }}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
              status === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-0 shadow-none">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data?.items.length ? (
          <MetaEventsTable rows={data.items} />
        ) : (
          <EmptyState
            title="Nothing here yet"
            description={
              status
                ? "No events with this status."
                : "Events appear once orders reach the point you chose to count a purchase."
            }
          />
        )}
      </Card>

      {data?.pagination && data.pagination.totalPages > 0 ? (
        <ListPagination
          page={page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
          isFetching={isFetching}
        />
      ) : null}
    </div>
  );
}
