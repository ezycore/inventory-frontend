"use client";
// coding-standard: maintained

import type { StorefrontSubscriber } from "@/services/api";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";
import { fmtDate } from "@/components/ecommerce/customers/accounts-table";
import { useOrgCalendar } from "@/hooks/use-org-calendar";

/**
 * Footer sign-ups — people who asked to hear from the shop and nothing more.
 *
 * Read-only, and it stays that way: every row is a **consent record** (who asked,
 * from where, when), so nothing in the admin app may create or edit one. The
 * only writer is the shopper's own submission on the storefront.
 *
 * The **Account** column is the column merchants actually scan: a subscriber who
 * also has a storefront account is a customer to talk to differently from a lead
 * who has never bought.
 */
export function SubscribersTable({
  subscribers,
  isLoading,
}: {
  subscribers: StorefrontSubscriber[];
  isLoading?: boolean;
}) {
  const { timezone } = useOrgCalendar();
  return (
    <Card className="overflow-hidden p-0 shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <th className="px-4 py-3">Email</th>
              <th className="px-3 py-3">Account</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={4} className="px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <div className="text-sm font-semibold">No sign-ups yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Switch your footer to <b>Stay in touch</b> under Online Store →
                    Customize → Footer to show a sign-up form on your shop.
                  </div>
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s._id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {s.hasAccount ? "Has an account" : "Lead only"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        s.status === "subscribed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.status === "subscribed" ? "Subscribed" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {fmtDate(s.createdAt, timezone)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
