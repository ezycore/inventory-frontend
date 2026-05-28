"use client";

import { format } from "date-fns";
import { Hash } from "lucide-react";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";

export type Tone = "in" | "out" | "neutral";

export interface TimelineChip {
  label: string;
  value: number;
  tone: Tone;
}

export interface TimelineEntry {
  id: string;
  label: string;
  direction: Tone;
  amount: number;
  date: string;
  accountName?: string;
  paymentMethod?: string;
  reference?: { label: string };
  notes?: string;
  /** Optional cross-document link (e.g. "From sale INV-1") rendered under the meta row. */
  source?: { prefix: string; label: string; onClick?: () => void };
}

export interface TimelineData {
  chips: TimelineChip[];
  entries: TimelineEntry[];
}

interface TransactionsTimelineProps {
  data?: TimelineData;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
}

const TONE_COLOR: Record<Tone, string> = {
  in: "text-green-600",
  out: "text-red-600",
  neutral: "text-blue-600",
};

function SummaryChip({ label, value, tone, formatCurrency }: TimelineChip & {
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${TONE_COLOR[tone]}`}>{formatCurrency(value)}</div>
    </div>
  );
}

export function TransactionsTimeline({
  data,
  isLoading,
  formatCurrency,
}: TransactionsTimelineProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="font-medium flex items-center gap-2">
        <Hash className="h-4 w-4" />
        Transactions
        {data && (
          <span className="text-xs text-muted-foreground font-normal">
            ({data.entries.length})
          </span>
        )}
      </div>
      <Separator />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !data ? (
        <div className="py-6 text-center text-muted-foreground text-sm">No transactions</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.chips.map((chip) => (
              <SummaryChip key={chip.label} {...chip} formatCurrency={formatCurrency} />
            ))}
          </div>

          {data.entries.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No transactions recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {data.entries.map((t) => {
                const sign = t.direction === "out" ? "-" : t.direction === "in" ? "+" : "";
                return (
                  <div
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.date), "dd MMM yyyy HH:mm")}
                        {t.accountName ? ` · ${t.accountName}` : ""}
                        {t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
                      </div>
                      {t.source && (
                        <div className="text-xs text-muted-foreground">
                          {t.source.prefix}{" "}
                          {t.source.onClick ? (
                            <button
                              type="button"
                              onClick={t.source.onClick}
                              className="font-mono text-primary hover:underline"
                            >
                              {t.source.label}
                            </button>
                          ) : (
                            <span className="font-mono">{t.source.label}</span>
                          )}
                        </div>
                      )}
                      {t.reference?.label && (
                        <div className="text-xs text-muted-foreground">
                          Ref: <span className="font-mono">{t.reference.label}</span>
                        </div>
                      )}
                      {t.notes && (
                        <div className="text-xs text-muted-foreground">{t.notes}</div>
                      )}
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${TONE_COLOR[t.direction]}`}>
                      {sign}
                      {formatCurrency(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
